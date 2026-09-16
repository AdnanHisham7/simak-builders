import { syncEngine } from "./syncEngine";
import { getSites } from "@/services/siteService";
import { getEmployees } from "@/services/employeeService";
import { getVendors } from "@/services/vendorService";
import { offlineDB } from "../db";
import { networkManager } from "../network/networkStatus";

export interface PreparationProgress {
  status: "idle" | "preparing" | "ready" | "error";
  progressPercent: number;
  message: string;
}

type ProgressListener = (progress: PreparationProgress) => void;

class OfflinePreparationManager {
  private currentProgress: PreparationProgress = {
    status: "idle",
    progressPercent: 0,
    message: "Ready",
  };
  private listeners: Set<ProgressListener> = new Set();
  private hasPreparedSession = false;

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProgress);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(update: Partial<PreparationProgress>) {
    this.currentProgress = { ...this.currentProgress, ...update };
    for (const listener of this.listeners) {
      listener(this.currentProgress);
    }
  }

  public getProgress(): PreparationProgress {
    return this.currentProgress;
  }

  public async prepareForOffline(force = false): Promise<boolean> {
    if (this.hasPreparedSession && !force) {
      return true;
    }

    if (!networkManager.isOnline()) {
      const siteCount = await offlineDB.sites.count();
      if (siteCount > 0) {
        this.notify({
          status: "ready",
          progressPercent: 100,
          message: "Operating in offline mode with cached data",
        });
        return true;
      } else {
        this.notify({
          status: "error",
          progressPercent: 0,
          message: "No offline data available. Please connect to internet once.",
        });
        return false;
      }
    }

    this.notify({
      status: "preparing",
      progressPercent: 10,
      message: "Starting offline data preparation...",
    });

    try {
      // 1. Fetch sites (35%)
      this.notify({ progressPercent: 25, message: "Downloading assigned sites..." });
      await getSites();

      // 2. Fetch employees (60%)
      this.notify({ progressPercent: 50, message: "Downloading employees directory..." });
      await getEmployees();

      // 3. Fetch vendors (80%)
      this.notify({ progressPercent: 75, message: "Downloading vendors list..." });
      await getVendors();

      // 4. Sync latest data delta (100%)
      this.notify({ progressPercent: 90, message: "Reconciling recent transactions..." });
      await syncEngine.syncNow();

      this.hasPreparedSession = true;
      this.notify({
        status: "ready",
        progressPercent: 100,
        message: "SIMAK is fully prepared for offline use",
      });

      return true;
    } catch (err: any) {
      console.warn("[OfflinePreparation] Warning during prep:", err);
      this.notify({
        status: "ready",
        progressPercent: 100,
        message: "Offline data ready (partial sync)",
      });
      return false;
    }
  }
}

export const offlinePreparation = new OfflinePreparationManager();
