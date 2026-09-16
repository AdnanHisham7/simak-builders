import { offlineDB } from "../db";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export const localGetEmployees = async (): Promise<any[]> => {
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get("/employees");
      const list = response.data || [];
      for (const emp of list) {
        const id = emp.id || emp._id?.toString();
        if (id) {
          await offlineDB.employees.put({
            id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            position: emp.position,
            dailyWage: emp.dailyWage || 0,
            updatedAt: emp.updatedAt || new Date().toISOString(),
            syncStatus: "synced",
          });
        }
      }
      return list;
    } catch {
      // Fallback
    }
  }

  return offlineDB.employees.toArray();
};

export const localGetVendors = async (): Promise<any[]> => {
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get("/vendors");
      const list = response.data || [];
      for (const ven of list) {
        const id = ven.id || ven._id?.toString();
        if (id) {
          await offlineDB.vendors.put({
            id,
            name: ven.name,
            email: ven.email,
            phone: ven.phone,
            updatedAt: ven.updatedAt || new Date().toISOString(),
            syncStatus: "synced",
          });
        }
      }
      return list;
    } catch {
      // Fallback
    }
  }

  return offlineDB.vendors.toArray();
};

export const localGetItems = async (search?: string): Promise<any[]> => {
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get("/items", { params: { search } });
      const list = response.data || [];
      for (const item of list) {
        const id = item.id || item._id?.toString();
        if (id) {
          await offlineDB.items.put({
            id,
            name: item.name,
            normalizedName: item.normalizedName || item.name.toLowerCase(),
            category: item.category,
            defaultUnit: item.defaultUnit,
            updatedAt: item.updatedAt || new Date().toISOString(),
            syncStatus: "synced",
          });
        }
      }
      return list;
    } catch {
      // Fallback
    }
  }

  let items = await offlineDB.items.toArray();
  if (search) {
    const term = search.toLowerCase();
    items = items.filter((i) => i.name.toLowerCase().includes(term));
  }
  return items;
};
