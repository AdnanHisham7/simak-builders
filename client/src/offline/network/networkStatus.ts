import { useState, useEffect } from "react";
import axios from "axios";

export type ConnectionStatus =
  | "ONLINE"
  | "OFFLINE"
  | "SERVER_UNAVAILABLE"
  | "SYNCING"
  | "SYNC_ERROR";

type Listener = (status: ConnectionStatus) => void;

class NetworkManager {
  private currentStatus: ConnectionStatus = navigator.onLine ? "ONLINE" : "OFFLINE";
  private listeners: Set<Listener> = new Set();
  private pingTimer: any = null;
  private isChecking = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleBrowserOnline());
      window.addEventListener("offline", () => this.setStatus("OFFLINE"));

      // Initial ping check
      this.checkConnectivity();

      // Periodic health check (every 25 seconds when online)
      this.pingTimer = setInterval(() => {
        if (navigator.onLine) {
          this.checkConnectivity();
        }
      }, 25000);
    }
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public isOnline(): boolean {
    return this.currentStatus === "ONLINE" || this.currentStatus === "SYNCING";
  }

  public setStatus(newStatus: ConnectionStatus): void {
    if (this.currentStatus !== newStatus) {
      this.currentStatus = newStatus;
      this.notify();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentStatus);
    }
  }

  private async handleBrowserOnline(): Promise<void> {
    await this.checkConnectivity();
  }

  public async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      this.setStatus("OFFLINE");
      return false;
    }

    if (this.isChecking) return this.isOnline();
    this.isChecking = true;

    try {
      const baseURL = import.meta.env.VITE_API_URL || "/api";
      // Request /health or /api/health
      const healthUrl = baseURL.endsWith("/api") ? `${baseURL}/health` : `${baseURL}/api/health`;
      
      const response = await axios.get(healthUrl, {
        timeout: 4000,
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.status === 200 && response.data?.status === "ok") {
        if (this.currentStatus !== "SYNCING") {
          this.setStatus("ONLINE");
        }
        this.isChecking = false;
        return true;
      } else {
        this.setStatus("SERVER_UNAVAILABLE");
        this.isChecking = false;
        return false;
      }
    } catch {
      // If the browser thinks online but API ping fails
      if (navigator.onLine) {
        this.setStatus("SERVER_UNAVAILABLE");
      } else {
        this.setStatus("OFFLINE");
      }
      this.isChecking = false;
      return false;
    }
  }

  public cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.listeners.clear();
  }
}

export const networkManager = new NetworkManager();

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>(networkManager.getStatus());

  useEffect(() => {
    return networkManager.subscribe(setStatus);
  }, []);

  return {
    status,
    isOnline: status === "ONLINE" || status === "SYNCING",
    isOffline: status === "OFFLINE" || status === "SERVER_UNAVAILABLE",
    isSyncing: status === "SYNCING",
    checkNow: () => networkManager.checkConnectivity(),
  };
};
