import { offlineDB, ConflictRecord } from "../db";
import {
  getPendingMutations,
  markMutationSuccess,
  markMutationFailed,
  markMutationConflict,
} from "./syncQueue";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export interface SyncEngineResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: number;
}

type SyncListener = (isSyncing: boolean, result?: SyncEngineResult) => void;

class SyncEngine {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private autoSyncInterval: any = null;

  constructor() {
    // Auto-sync when transitioning to online
    networkManager.subscribe((status) => {
      if (status === "ONLINE") {
        this.syncNow().catch(() => {});
      }
    });

    // Periodic auto-sync every 3 minutes when online
    this.autoSyncInterval = setInterval(() => {
      if (networkManager.isOnline()) {
        this.syncNow().catch(() => {});
      }
    }, 3 * 60 * 1000);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isSyncing: boolean, result?: SyncEngineResult) {
    for (const listener of this.listeners) {
      listener(isSyncing, result);
    }
  }

  public async syncNow(): Promise<SyncEngineResult> {
    if (this.isSyncing) {
      return { pushed: 0, pulled: 0, conflicts: 0, errors: 0 };
    }

    if (!networkManager.isOnline()) {
      return { pushed: 0, pulled: 0, conflicts: 0, errors: 0 };
    }

    this.isSyncing = true;
    networkManager.setStatus("SYNCING");
    this.notify(true);

    const summary: SyncEngineResult = {
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: 0,
    };

    try {
      // Step 1: Push pending mutations to server
      const pushRes = await this.pushPendingMutations();
      summary.pushed = pushRes.pushed;
      summary.conflicts = pushRes.conflicts;
      summary.errors = pushRes.errors;

      // Step 2: Pull fresh changes from server
      const pulledCount = await this.pullLatestChanges();
      summary.pulled = pulledCount;

      networkManager.setStatus("ONLINE");
    } catch (err) {
      console.error("[SyncEngine] Sync failed:", err);
      networkManager.setStatus("SYNC_ERROR");
      summary.errors += 1;
    } finally {
      this.isSyncing = false;
      this.notify(false, summary);
    }

    return summary;
  }

  public async pushPendingMutations(): Promise<{
    pushed: number;
    conflicts: number;
    errors: number;
  }> {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) {
      return { pushed: 0, conflicts: 0, errors: 0 };
    }

    let pushed = 0;
    let conflicts = 0;
    let errors = 0;

    try {
      const response = await privateClient.post("/sync/push", { mutations });
      const results: Array<{
        clientMutationId: string;
        status: "synced" | "conflict" | "failed";
        serverId?: string;
        serverVersion?: number;
        error?: string;
      }> = response.data?.results || [];

      for (const res of results) {
        const matchingQueueItem = mutations.find(
          (m) => m.clientMutationId === res.clientMutationId
        );
        if (!matchingQueueItem || !matchingQueueItem.id) continue;

        if (res.status === "synced") {
          pushed++;
          await markMutationSuccess(matchingQueueItem.id);

          // Update local entity record to synced state
          const { entity, recordId } = matchingQueueItem;
          if (entity === "attendance") {
            const item = await offlineDB.attendance.get(recordId);
            if (item) {
              await offlineDB.attendance.put({
                ...item,
                id: res.serverId || item.id,
                syncStatus: "synced",
                version: res.serverVersion || item.version || 1,
              });
              if (res.serverId && res.serverId !== recordId) {
                await offlineDB.attendance.delete(recordId);
              }
            }
          } else if (entity === "purchases") {
            const item = await offlineDB.purchases.get(recordId);
            if (item) {
              await offlineDB.purchases.put({
                ...item,
                id: res.serverId || item.id,
                syncStatus: "synced",
                version: res.serverVersion || item.version || 1,
              });
              if (res.serverId && res.serverId !== recordId) {
                await offlineDB.purchases.delete(recordId);
              }
            }
          } else if (entity === "miscellaneousExpenses") {
            const item = await offlineDB.miscellaneousExpenses.get(recordId);
            if (item) {
              await offlineDB.miscellaneousExpenses.put({
                ...item,
                id: res.serverId || item.id,
                syncStatus: "synced",
                version: res.serverVersion || item.version || 1,
              });
              if (res.serverId && res.serverId !== recordId) {
                await offlineDB.miscellaneousExpenses.delete(recordId);
              }
            }
          }
        } else if (res.status === "conflict") {
          conflicts++;
          await markMutationConflict(matchingQueueItem.id, res.error || "Conflict");

          const conflictRecord: ConflictRecord = {
            id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            clientMutationId: res.clientMutationId,
            entity: matchingQueueItem.entity,
            recordId: matchingQueueItem.recordId,
            clientPayload: matchingQueueItem.payload,
            reason: res.error || "Server detected conflict",
            createdAt: new Date().toISOString(),
            resolved: false,
          };
          await offlineDB.conflicts.put(conflictRecord);
        } else {
          errors++;
          await markMutationFailed(
            matchingQueueItem.id,
            res.error || "Push failed",
            matchingQueueItem.attempts
          );
        }
      }
    } catch (err: any) {
      console.error("[SyncEngine] Push network/server error:", err);
      errors += mutations.length;
    }

    return { pushed, conflicts, errors };
  }

  public async pullLatestChanges(): Promise<number> {
    const meta = await offlineDB.sync_metadata.get("main");
    const lastSyncTimestamp = meta?.lastSyncTimestamp;

    const response = await privateClient.post("/sync/pull", {
      lastSyncTimestamp,
    });

    const data = response.data;
    if (!data || !data.changes) return 0;

    let count = 0;
    const {
      sites = [],
      attendance = [],
      purchases = [],
      miscellaneousExpenses = [],
      employees = [],
      vendors = [],
      items = [],
    } = data.changes;

    // 1. Sites
    for (const site of sites) {
      const siteId = site._id?.toString() || site.id;
      if (!siteId) continue;
      count++;
      await offlineDB.sites.put({
        id: siteId,
        name: site.name,
        address: site.address,
        city: site.city,
        state: site.state,
        zip: site.zip,
        client: site.client,
        status: site.status,
        phases: site.phases || [],
        budget: site.budget || 0,
        expenses: site.expenses || 0,
        supervisionPercentage: site.supervisionPercentage || 0,
        transactions: site.transactions || [],
        documents: site.documents || [],
        siteManagers: site.siteManagers || [],
        architects: site.architects || [],
        supervisors: site.supervisors || [],
        version: site.version || 1,
        updatedAt: site.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 2. Attendance
    for (const att of attendance) {
      const attId = att._id?.toString() || att.id;
      if (!attId) continue;
      count++;
      const employeeId =
        typeof att.employee === "object"
          ? att.employee?._id?.toString()
          : att.employee?.toString();
      const siteId =
        typeof att.site === "object"
          ? att.site?._id?.toString()
          : att.site?.toString();
      const dateStr = att.date ? new Date(att.date).toISOString().split("T")[0] : "";

      await offlineDB.attendance.put({
        id: attId,
        employeeId,
        siteId,
        date: dateStr,
        status: att.status,
        dailyWage: att.dailyWage,
        isPaid: att.isPaid,
        markedBy: att.markedBy?.toString(),
        version: att.version || 1,
        updatedAt: att.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 3. Purchases
    for (const pur of purchases) {
      const purId = pur._id?.toString() || pur.id;
      if (!purId) continue;
      count++;
      await offlineDB.purchases.put({
        id: purId,
        siteId: pur.site?.toString(),
        vendorId: pur.vendor?.toString(),
        items: pur.items || [],
        totalAmount: pur.totalAmount || 0,
        transportationFee: pur.transportationFee || 0,
        paymentMethod: pur.payment?.method || "cash",
        sourceOfFunds: pur.sourceOfFunds,
        deductFromUserId: pur.deductFromUserId?.toString(),
        notes: pur.notes,
        date: pur.date ? new Date(pur.date).toISOString().split("T")[0] : "",
        status: pur.status || "pending",
        version: pur.version || 1,
        updatedAt: pur.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 4. Miscellaneous Expenses
    for (const misc of miscellaneousExpenses) {
      const miscId = misc._id?.toString() || misc.id;
      if (!miscId) continue;
      count++;
      await offlineDB.miscellaneousExpenses.put({
        id: miscId,
        siteId: misc.site?.toString(),
        category: misc.category,
        name: misc.name,
        amount: misc.amount || 0,
        tip: misc.tip || 0,
        notes: misc.notes,
        date: misc.date ? new Date(misc.date).toISOString().split("T")[0] : "",
        paymentMethod: misc.paymentMethod || "cash",
        sourceOfFunds: misc.sourceOfFunds,
        deductFromUserId: misc.deductFromUserId?.toString(),
        vendorId: misc.vendor?.toString(),
        status: misc.status || "pending",
        version: misc.version || 1,
        updatedAt: misc.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 5. Employees
    for (const emp of employees) {
      const empId = emp._id?.toString() || emp.id;
      if (!empId) continue;
      count++;
      await offlineDB.employees.put({
        id: empId,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        position: emp.position,
        dailyWage: emp.dailyWage || 0,
        updatedAt: emp.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 6. Vendors
    for (const ven of vendors) {
      const venId = ven._id?.toString() || ven.id;
      if (!venId) continue;
      count++;
      await offlineDB.vendors.put({
        id: venId,
        name: ven.name,
        email: ven.email,
        phone: ven.phone,
        updatedAt: ven.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // 7. Items Master
    for (const item of items) {
      const itemId = item._id?.toString() || item.id;
      if (!itemId) continue;
      count++;
      await offlineDB.items.put({
        id: itemId,
        name: item.name,
        normalizedName: item.normalizedName,
        category: item.category,
        defaultUnit: item.defaultUnit,
        updatedAt: item.updatedAt || new Date().toISOString(),
        syncStatus: "synced",
      });
    }

    // Update last sync timestamp
    if (data.serverTimestamp) {
      await offlineDB.sync_metadata.put({
        key: "main",
        lastSyncTimestamp: data.serverTimestamp,
        status: "synced",
      });
    }

    return count;
  }

  public cleanup() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    this.listeners.clear();
  }
}

export const syncEngine = new SyncEngine();
