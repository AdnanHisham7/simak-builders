import { offlineDB, LocalMiscellaneousExpense } from "../db";
import { enqueueMutation, generateClientId } from "../sync/syncQueue";
import { syncEngine } from "../sync/syncEngine";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export const localAddMiscellaneousExpense = async (data: {
  siteId: string | null;
  name: string;
  category: "machinery" | "rental" | "service" | "material" | string;
  tip: number;
  notes: string;
  amount: number;
  sourceOfFunds: "company" | "siteManager";
  deductFromUserId?: string;
  paymentMethod: string;
  vendorId: string | undefined;
  date: string;
}): Promise<{ message: string; expenseId: string; isOffline: boolean }> => {
  const isOnline = networkManager.isOnline();
  const localId = `misc-${generateClientId()}`;

  if (isOnline) {
    try {
      const response = await privateClient.post("/miscellaneous-expenses", data);
      syncEngine.pullLatestChanges().catch(() => {});
      return {
        message: response.data?.message || "Expense added",
        expenseId: response.data?.expenseId || localId,
        isOffline: false,
      };
    } catch (err: any) {
      if (!err.response || err.code === "ERR_NETWORK" || err.response.status >= 500) {
        // Fallback to offline
      } else {
        throw err;
      }
    }
  }

  const localRecord: LocalMiscellaneousExpense = {
    id: localId,
    siteId: data.siteId || "",
    category: data.category as any,
    name: data.name,
    amount: data.amount,
    tip: data.tip || 0,
    notes: data.notes,
    date: data.date,
    paymentMethod: (data.paymentMethod as any) || "cash",
    sourceOfFunds: data.sourceOfFunds,
    deductFromUserId: data.deductFromUserId,
    vendorId: data.vendorId,
    status: "pending",
    updatedAt: new Date().toISOString(),
    syncStatus: "pending",
  };

  await offlineDB.miscellaneousExpenses.put(localRecord);

  await enqueueMutation("miscellaneousExpenses", "CREATE", localId, data);

  return {
    message: "Expense saved offline (will sync when connected)",
    expenseId: localId,
    isOffline: true,
  };
};

export const localGetMiscellaneousExpensesBySite = async (
  siteId: string
): Promise<any[]> => {
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get(
        `/miscellaneous-expenses/site?siteId=${siteId}`
      );
      return response.data;
    } catch {
      // Fallback to local
    }
  }

  return offlineDB.miscellaneousExpenses.where("siteId").equals(siteId).toArray();
};
