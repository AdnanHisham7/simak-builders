import { offlineDB, LocalSite } from "../db";
import { networkManager } from "../network/networkStatus";
import { privateClient } from "@/api";

export const localGetSites = async (params: any = {}): Promise<any> => {
  // If online, fetch fresh and cache
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get("/sites", { params });
      const sites = Array.isArray(response.data) ? response.data : response.data?.sites || [];

      for (const s of sites) {
        const id = s.id || s._id?.toString();
        if (id) {
          await offlineDB.sites.put({
            id,
            name: s.name,
            address: s.address,
            city: s.city,
            state: s.state,
            zip: s.zip,
            client: s.client,
            status: s.status,
            phases: s.phases || [],
            budget: s.budget || 0,
            expenses: s.expenses || 0,
            supervisionPercentage: s.supervisionPercentage || 0,
            transactions: s.transactions || [],
            documents: s.documents || [],
            siteManagers: s.siteManagers || [],
            architects: s.architects || [],
            supervisors: s.supervisors || [],
            version: s.version || 1,
            updatedAt: s.updatedAt || new Date().toISOString(),
            syncStatus: "synced",
          });
        }
      }

      return response.data;
    } catch {
      // Fallback to local
    }
  }

  // Fallback to local Dexie store
  let sites = await offlineDB.sites.toArray();
  if (params.search) {
    const term = params.search.toLowerCase();
    sites = sites.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term) ||
        s.city.toLowerCase().includes(term)
    );
  }
  if (params.status && params.status !== "All Statuses") {
    sites = sites.filter((s) => s.status === params.status);
  }

  return sites;
};

export const localGetSiteDetails = async (siteId: string): Promise<any> => {
  if (networkManager.isOnline()) {
    try {
      const response = await privateClient.get(`/sites/${siteId}`);
      const data = response.data;
      if (data?.site) {
        const s = data.site;
        await offlineDB.sites.put({
          id: siteId,
          name: s.name,
          address: s.address,
          city: s.city,
          state: s.state,
          zip: s.zip,
          client: data.client,
          status: s.status,
          phases: s.phases || [],
          budget: s.budget || 0,
          expenses: s.expenses || 0,
          supervisionPercentage: s.supervisionPercentage || 0,
          transactions: data.transactions || s.transactions || [],
          documents: s.documents || [],
          siteManagers: data.siteManagers || [],
          architects: data.architects || [],
          supervisors: data.supervisors || [],
          version: s.version || 1,
          updatedAt: s.updatedAt || new Date().toISOString(),
          syncStatus: "synced",
        });
      }
      return data;
    } catch {
      // Fallback to local
    }
  }

  const cachedSite = await offlineDB.sites.get(siteId);
  if (cachedSite) {
    return {
      site: cachedSite,
      siteManagers: cachedSite.siteManagers || [],
      architects: cachedSite.architects || [],
      supervisors: cachedSite.supervisors || [],
      client: cachedSite.client,
      transactions: cachedSite.transactions || [],
    };
  }

  throw new Error("Site not found locally and device is offline");
};
