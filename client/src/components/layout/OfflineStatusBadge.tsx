import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNetworkStatus } from "@/offline/network/networkStatus";
import { syncEngine } from "@/offline/sync/syncEngine";
import { getPendingCount } from "@/offline/sync/syncQueue";
import Tooltip from "@/components/ui/Tooltip";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const OfflineStatusBadge: React.FC = () => {
  const { status, isOnline, isOffline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const navigate = useNavigate();

  const refreshPending = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    refreshPending();

    const unsubscribeSync = syncEngine.subscribe((syncing) => {
      setIsSyncing(syncing);
      refreshPending();
    });

    const interval = setInterval(refreshPending, 5000);
    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const handleBadgeClick = async () => {
    if (isOffline) {
      toast.info(
        pendingCount > 0
          ? `You have ${pendingCount} offline change(s). They will sync automatically when reconnected.`
          : "You are currently offline. Supported operations will save locally."
      );
    } else if (isOnline) {
      toast.promise(syncEngine.syncNow(), {
        loading: "Synchronizing data...",
        success: (res) => `Synced: ${res.pushed} uploaded, ${res.pulled} refreshed.`,
        error: "Sync encountered an issue. Will retry automatically.",
      });
    }
  };

  if (isSyncing || status === "SYNCING") {
    return (
      <Tooltip label="Syncing local changes with server...">
        <button
          onClick={handleBadgeClick}
          className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
        >
          <RefreshCw size={13} className="animate-spin text-brand-600" />
          <span>Syncing...</span>
        </button>
      </Tooltip>
    );
  }

  if (isOffline) {
    return (
      <Tooltip label={pendingCount > 0 ? `${pendingCount} changes waiting to sync` : "Offline mode active"}>
        <button
          onClick={handleBadgeClick}
          className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200 transition-colors hover:bg-amber-100"
        >
          <WifiOff size={13} className="text-amber-600" />
          <span>Offline</span>
          {pendingCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </Tooltip>
    );
  }

  if (status === "SYNC_ERROR") {
    return (
      <Tooltip label="Sync issue detected. Click to retry.">
        <button
          onClick={handleBadgeClick}
          className="flex items-center gap-1.5 rounded-full bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700 border border-danger-200 transition-colors hover:bg-danger-100"
        >
          <AlertTriangle size={13} className="text-danger-600" />
          <span>Sync Issue</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label="Connected & Synchronized">
      <button
        onClick={handleBadgeClick}
        className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline">Online</span>
        {pendingCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>
    </Tooltip>
  );
};
