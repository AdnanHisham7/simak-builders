import { offlineDB } from "../db";
import { syncEngine } from "../sync/syncEngine";

export interface SimakBackupPayload {
  format: "simak-backup";
  version: number;
  createdAt: string;
  data: {
    sites: any[];
    attendance: any[];
    purchases: any[];
    miscellaneousExpenses: any[];
    employees: any[];
    vendors: any[];
    items: any[];
    sync_queue: any[];
  };
}

export const exportLocalBackup = async (): Promise<void> => {
  const [
    sites,
    attendance,
    purchases,
    miscellaneousExpenses,
    employees,
    vendors,
    items,
    sync_queue,
  ] = await Promise.all([
    offlineDB.sites.toArray(),
    offlineDB.attendance.toArray(),
    offlineDB.purchases.toArray(),
    offlineDB.miscellaneousExpenses.toArray(),
    offlineDB.employees.toArray(),
    offlineDB.vendors.toArray(),
    offlineDB.items.toArray(),
    offlineDB.sync_queue.toArray(),
  ]);

  // Exclude any blob files from JSON serialization
  const serializedPurchases = purchases.map((p) => {
    const { billFileBlob, ...rest } = p;
    return rest;
  });

  const backup: SimakBackupPayload = {
    format: "simak-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    data: {
      sites,
      attendance,
      purchases: serializedPurchases,
      miscellaneousExpenses,
      employees,
      vendors,
      items,
      sync_queue,
    },
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `SIMAK-backup-${dateStr}.simakbackup`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreLocalBackup = async (
  fileContent: string
): Promise<{
  success: boolean;
  message: string;
  restoredCounts: Record<string, number>;
}> => {
  let parsed: SimakBackupPayload;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    throw new Error("Invalid backup file: Not a valid JSON document");
  }

  if (parsed.format !== "simak-backup" || !parsed.version || !parsed.data) {
    throw new Error("Invalid SIMAK backup format or corrupted file structure");
  }

  if (parsed.version > 1) {
    throw new Error(`Unsupported backup version: v${parsed.version}. Please update SIMAK.`);
  }

  // 1. Create a safety snapshot of current data before overwriting
  const currentSites = await offlineDB.sites.toArray();
  const safetySnapshot = {
    createdAt: new Date().toISOString(),
    sitesCount: currentSites.length,
  };
  localStorage.setItem("simak_safety_backup_meta", JSON.stringify(safetySnapshot));

  // 2. Clear current tables and insert backup records
  const counts: Record<string, number> = {};

  await offlineDB.transaction("rw", [
    offlineDB.sites,
    offlineDB.attendance,
    offlineDB.purchases,
    offlineDB.miscellaneousExpenses,
    offlineDB.employees,
    offlineDB.vendors,
    offlineDB.items,
    offlineDB.sync_queue,
  ], async () => {
    // Sites
    if (parsed.data.sites?.length) {
      await offlineDB.sites.bulkPut(parsed.data.sites);
      counts.sites = parsed.data.sites.length;
    }
    // Attendance
    if (parsed.data.attendance?.length) {
      await offlineDB.attendance.bulkPut(parsed.data.attendance);
      counts.attendance = parsed.data.attendance.length;
    }
    // Purchases
    if (parsed.data.purchases?.length) {
      await offlineDB.purchases.bulkPut(parsed.data.purchases);
      counts.purchases = parsed.data.purchases.length;
    }
    // Miscellaneous Expenses
    if (parsed.data.miscellaneousExpenses?.length) {
      await offlineDB.miscellaneousExpenses.bulkPut(parsed.data.miscellaneousExpenses);
      counts.miscellaneousExpenses = parsed.data.miscellaneousExpenses.length;
    }
    // Employees
    if (parsed.data.employees?.length) {
      await offlineDB.employees.bulkPut(parsed.data.employees);
      counts.employees = parsed.data.employees.length;
    }
    // Vendors
    if (parsed.data.vendors?.length) {
      await offlineDB.vendors.bulkPut(parsed.data.vendors);
      counts.vendors = parsed.data.vendors.length;
    }
    // Items
    if (parsed.data.items?.length) {
      await offlineDB.items.bulkPut(parsed.data.items);
      counts.items = parsed.data.items.length;
    }
    // Sync Queue
    if (parsed.data.sync_queue?.length) {
      await offlineDB.sync_queue.bulkPut(parsed.data.sync_queue);
      counts.sync_queue = parsed.data.sync_queue.length;
    }
  });

  // 3. Trigger reconciliation if online
  syncEngine.syncNow().catch(() => {});

  return {
    success: true,
    message: "Local backup restored successfully.",
    restoredCounts: counts,
  };
};

export const clearLocalOfflineData = async (): Promise<void> => {
  await Promise.all([
    offlineDB.sites.clear(),
    offlineDB.attendance.clear(),
    offlineDB.purchases.clear(),
    offlineDB.miscellaneousExpenses.clear(),
    offlineDB.employees.clear(),
    offlineDB.vendors.clear(),
    offlineDB.items.clear(),
    offlineDB.sync_queue.clear(),
    offlineDB.conflicts.clear(),
    offlineDB.sync_metadata.clear(),
  ]);
};
