import React, { useState, useEffect, useRef } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Database,
  HardDrive,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { useNetworkStatus } from "@/offline/network/networkStatus";
import { syncEngine } from "@/offline/sync/syncEngine";
import {
  getPendingMutations,
  clearSyncQueue,
} from "@/offline/sync/syncQueue";
import { offlineDB, SyncQueueItem } from "@/offline/db";
import {
  exportLocalBackup,
  restoreLocalBackup,
  clearLocalOfflineData,
} from "@/offline/backup/backupService";
import { toast } from "sonner";

export const OfflineSyncCard: React.FC = () => {
  const { status, isOnline, isOffline, checkNow } = useNetworkStatus();
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{
    usageMB: string;
    quotaMB: string;
  } | null>(null);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOfflineState = async () => {
    try {
      const items = await getPendingMutations();
      setPendingItems(items);

      const meta = await offlineDB.sync_metadata.get("main");
      if (meta?.lastSyncTimestamp) {
        setLastSyncTime(new Date(meta.lastSyncTimestamp).toLocaleString());
      }

      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usageMB = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
        const quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
        setStorageEstimate({ usageMB, quotaMB });
      }
    } catch (e) {
      console.error("Error loading offline state:", e);
    }
  };

  useEffect(() => {
    loadOfflineState();
    const unsubscribe = syncEngine.subscribe((syncing) => {
      setIsSyncing(syncing);
      loadOfflineState();
    });
    return () => unsubscribe();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await syncEngine.syncNow();
      toast.success(
        `Sync completed: ${res.pushed} uploaded, ${res.pulled} updated.`
      );
      loadOfflineState();
    } catch {
      toast.error("Sync failed. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await exportLocalBackup();
      toast.success("Local backup downloaded successfully");
    } catch {
      toast.error("Failed to generate backup");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedBackupFile(e.target.files[0]);
      setIsRestoreModalOpen(true);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupFile) return;
    setIsRestoring(true);
    try {
      const text = await selectedBackupFile.text();
      const res = await restoreLocalBackup(text);
      toast.success(res.message);
      setIsRestoreModalOpen(false);
      setSelectedBackupFile(null);
      loadOfflineState();
    } catch (err: any) {
      toast.error(err.message || "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmClear = async () => {
    try {
      await clearLocalOfflineData();
      toast.success("Local offline data cleared");
      setIsClearModalOpen(false);
      loadOfflineState();
    } catch {
      toast.error("Failed to clear offline data");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-console-border pb-5">
        <div>
          <h2 className="text-lg font-semibold text-console-text flex items-center gap-2">
            <Database size={20} className="text-brand-600" />
            Offline & Synchronization
          </h2>
          <p className="text-sm text-console-muted mt-1">
            Manage your local device database, offline queue, and sync status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={checkNow}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Ping API
          </Button>
          <Button
            size="sm"
            onClick={handleSyncNow}
            disabled={isOffline || isSyncing}
            loading={isSyncing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Grid status stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-console-border bg-console-bg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-console-muted">Connection</span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Wifi size={14} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <WifiOff size={14} /> Offline
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-console-text">
            {status === "ONLINE"
              ? "All Systems Operational"
              : status === "SYNCING"
              ? "Synchronizing Changes..."
              : status === "OFFLINE"
              ? "Device Disconnected"
              : "Server Unreachable"}
          </p>
        </div>

        <div className="rounded-lg border border-console-border bg-console-bg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-console-muted">Pending Changes</span>
            <Clock size={14} className="text-console-muted" />
          </div>
          <p className="mt-2 text-xl font-bold text-console-text">
            {pendingItems.length}
          </p>
          <p className="text-xs text-console-muted">
            {pendingItems.length > 0
              ? "Queued to sync automatically"
              : "All local changes synchronized"}
          </p>
        </div>

        <div className="rounded-lg border border-console-border bg-console-bg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-console-muted">Local Storage</span>
            <HardDrive size={14} className="text-console-muted" />
          </div>
          <p className="mt-2 text-sm font-semibold text-console-text">
            {storageEstimate ? `${storageEstimate.usageMB} MB used` : "IndexedDB Ready"}
          </p>
          <p className="text-xs text-console-muted">
            Last sync: {lastSyncTime || "Not yet synced"}
          </p>
        </div>
      </div>

      {/* Pending Items List */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-console-text">
            Pending Offline Queue ({pendingItems.length})
          </h3>
          <div className="max-h-48 overflow-y-auto divide-y divide-console-border rounded-lg border border-console-border bg-white">
            {pendingItems.map((item) => (
              <div
                key={item.clientMutationId}
                className="flex items-center justify-between p-3 text-xs"
              >
                <div>
                  <span className="font-semibold uppercase text-brand-700 mr-2">
                    {item.operation}
                  </span>
                  <span className="capitalize text-console-text">
                    {item.entity}
                  </span>
                  <span className="text-console-muted ml-2">
                    ({new Date(item.createdAt).toLocaleTimeString()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup and Restore Actions */}
      <div className="border-t border-console-border pt-5 space-y-4">
        <h3 className="text-sm font-semibold text-console-text">
          Backup & Device Data Maintenance
        </h3>
        <p className="text-xs text-console-muted">
          Export your local offline data to a versioned backup file or restore from a previous backup.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5"
          >
            <Download size={15} /> Export Backup (.simakbackup)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5"
          >
            <Upload size={15} /> Restore From Backup
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".simakbackup,.json"
            className="hidden"
          />

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-1.5 ml-auto"
          >
            <Trash2 size={15} /> Reset Offline Cache
          </Button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Restore Local Offline Data"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRestore}
              loading={isRestoring}
              className="flex items-center gap-1.5"
            >
              <CheckCircle size={16} /> Confirm Restore
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-console-muted">
            You are about to restore data from{" "}
            <strong>{selectedBackupFile?.name}</strong>.
          </p>
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            A safety backup of your existing local database will be automatically preserved.
            Restored changes will synchronize with the server once connected.
          </div>
        </div>
      </Modal>

      {/* Clear Cache Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Reset Local Offline Cache"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmClear}
              className="flex items-center gap-1.5"
            >
              <Trash2 size={16} /> Yes, Clear Cache
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-danger-700">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">
              This will erase all cached sites, attendance, and pending offline mutations stored on this browser.
              Make sure any essential work has synced or you have exported a backup.
            </p>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
