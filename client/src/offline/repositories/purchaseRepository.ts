import { offlineDB, LocalPurchase } from "../db";
import { enqueueMutation, generateClientId } from "../sync/syncQueue";
import { syncEngine } from "../sync/syncEngine";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export const localAddPurchase = async (
  purchaseData: FormData | any
): Promise<{ message: string; purchaseId: string; isOffline: boolean }> => {
  const isOnline = networkManager.isOnline();
  const localId = `pur-${generateClientId()}`;

  // If online, prefer standard API call directly so multipart file uploads are immediate
  if (isOnline) {
    try {
      const response = await privateClient.post("/purchases", purchaseData);
      // Trigger background sync to refresh local cache
      syncEngine.pullLatestChanges().catch(() => {});
      return {
        message: response.data?.message || "Purchase added",
        purchaseId: response.data?.purchaseId || localId,
        isOffline: false,
      };
    } catch (err: any) {
      // If error is a network error or server unavailable, fall back to offline queue
      if (!err.response || err.code === "ERR_NETWORK" || err.response.status >= 500) {
        // Fallback to offline
      } else {
        throw err;
      }
    }
  }

  // Parse FormData if needed
  let siteId: string | undefined;
  let vendorId = "";
  let paymentMethod: "cash" | "credit" = "cash";
  let totalAmount = 0;
  let transportationFee = 0;
  let sourceOfFunds: "company" | "siteManager" = "company";
  let deductFromUserId: string | undefined;
  let notes = "";
  let date = new Date().toISOString().split("T")[0];
  let items: any[] = [];
  let billFileName: string | undefined;
  let billFileBlob: Blob | undefined;

  if (purchaseData instanceof FormData) {
    siteId = (purchaseData.get("siteId") as string) || undefined;
    vendorId = (purchaseData.get("vendorId") as string) || "";
    paymentMethod = (purchaseData.get("paymentMethod") as "cash" | "credit") || "cash";
    totalAmount = parseFloat((purchaseData.get("totalAmount") as string) || "0");
    transportationFee = parseFloat((purchaseData.get("transportationFee") as string) || "0");
    sourceOfFunds = (purchaseData.get("sourceOfFunds") as "company" | "siteManager") || "company";
    deductFromUserId = (purchaseData.get("deductFromUserId") as string) || undefined;
    notes = (purchaseData.get("notes") as string) || "";
    date = (purchaseData.get("date") as string) || date;

    const itemsRaw = purchaseData.get("items");
    if (typeof itemsRaw === "string") {
      try {
        items = JSON.parse(itemsRaw);
      } catch {}
    }

    const file = purchaseData.get("billUpload") as File | null;
    if (file && file.size > 0) {
      billFileName = file.name;
      billFileBlob = file;
    }
  } else {
    siteId = purchaseData.siteId;
    vendorId = purchaseData.vendorId;
    paymentMethod = purchaseData.paymentMethod || "cash";
    totalAmount = parseFloat(purchaseData.totalAmount || "0");
    transportationFee = parseFloat(purchaseData.transportationFee || "0");
    sourceOfFunds = purchaseData.sourceOfFunds || "company";
    deductFromUserId = purchaseData.deductFromUserId;
    notes = purchaseData.notes || "";
    date = purchaseData.date || date;
    items = purchaseData.items || [];
  }

  // Get vendor name for local preview
  const vendor = await offlineDB.vendors.get(vendorId);

  const localRecord: LocalPurchase = {
    id: localId,
    siteId,
    vendorId,
    vendorName: vendor?.name,
    items,
    totalAmount,
    transportationFee,
    paymentMethod,
    sourceOfFunds,
    deductFromUserId,
    notes,
    date,
    status: "pending",
    billFileName,
    billFileBlob,
    updatedAt: new Date().toISOString(),
    syncStatus: "pending",
  };

  // 1. Save to IndexedDB
  await offlineDB.purchases.put(localRecord);

  // 2. Enqueue in sync queue
  await enqueueMutation("purchases", "CREATE", localId, {
    siteId,
    vendorId,
    paymentMethod,
    totalAmount,
    transportationFee,
    sourceOfFunds,
    deductFromUserId,
    notes,
    date,
    items,
  });

  return {
    message: "Purchase saved offline (will sync when connected)",
    purchaseId: localId,
    isOffline: true,
  };
};

export const localGetPurchasesBySite = async (
  siteId: string,
  status?: string | null
): Promise<any[]> => {
  // If online, fetch from API
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get("/purchases/by-site", {
        params: { siteId, status },
      });
      return response.data;
    } catch {
      // Fall back to local
    }
  }

  let query = offlineDB.purchases.where("siteId").equals(siteId);
  let records = await query.toArray();

  if (status) {
    records = records.filter((r) => r.status === status);
  }

  return records;
};
