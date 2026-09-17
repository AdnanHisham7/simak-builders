import { privateClient } from "@/api";
import { withCache, invalidateCache } from "@/helpers/requestCache";
import { offlineDB } from "@/offline/db";

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url: string;
  uploadedBy: { id: string; name: string };
  category: "client" | "site";
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "purchase" | "miscellaneous" | "attendance" | "stockTransfer";
  description?: string;
  relatedId?: string;
  user?: { id: string; name: string };
}

export interface Site {
  architectCount: number;
  siteManagerCount: number;
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  siteManagers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  architects: Array<{ id: string; name: string; email: string; role: string }>;
  supervisors: Array<{ id: string; name: string; email: string; role: string }>;
  client: {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    isKYCCompleted: boolean;
    isBlocked: boolean;
    isAdmin: boolean;
  };
  status: string;
  phases: Array<{
    id: string;
    name: string;
    status: "not started" | "pending" | "completed";
    completionDate?: string;
  }>;
  budget: number;
  expenses: number;
  supervisionPercentage: number;
  transactions: Transaction[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

const mapSiteData = (site: any) => ({
  id: site?._id.toString(),
  name: site?.name,
  address: site?.address,
  city: site?.city,
  state: site?.state,
  zip: site?.zip,
  siteManagers:
    site?.siteManagers?.map((sm: any) => ({
      id: sm?._id.toString(),
      name: sm?.name,
      email: sm?.email,
      role: sm?.role,
    })) || [],
  architects:
    site?.architects?.map((a: any) => ({
      id: a?._id.toString(),
      name: a?.name,
      email: a?.email,
      role: a?.role,
    })) || [],
  supervisors:
    site?.supervisors?.map((s: any) => ({
      id: s?._id.toString(),
      name: s?.name,
      email: s?.email,
      role: s?.role,
    })) || [],
  client: site?.client
    ? {
        id: site?.client?._id.toString(),
        name: site?.client?.name,
        email: site?.client?.email,
        role: site?.client?.role,
        isEmailVerified: site?.client?.isEmailVerified,
        isKYCCompleted: site?.client?.isKYCCompleted,
        isBlocked: site?.client?.isBlocked,
        isAdmin: site?.client?.isAdmin,
      }
    : null,
  status: site?.status,
  phases: site?.phases?.map((p: any) => ({
    id: p?._id?.toString(),
    name: p?.name,
    status: p?.status,
    completionDate: p?.completionDate,
  })),
  budget: site?.budget || 0,
  expenses: site?.expenses || 0,
  supervisionPercentage: site?.supervisionPercentage || 0,
  documents: site?.documents?.map((doc: any) => ({
    id: doc?._id.toString(),
    name: doc?.name,
    size: doc?.size,
    type: doc?.type,
    uploadDate: doc?.uploadDate,
    url: doc?.url,
    uploadedBy: {
      id: doc?.uploadedBy._id.toString(),
      name: doc?.uploadedBy.name,
    },
    category: doc?.category,
  })),
  transactions:
    site?.transactions?.map((t: any) => ({
      id: t?._id.toString(),
      date: t?.date,
      amount: t?.amount,
      type: t?.type,
      description: t?.description,
      relatedId: t?.relatedId?.toString(),
      user: t?.user
        ? {
            id: t?.user._id?.toString(),
            name: t?.user.name,
          }
        : undefined,
    })) || [],
  createdAt: site?.createdAt,
  siteManagerCount: site?.siteManagerCount,
  architectCount: site?.architectCount,
  completedPhases: site?.completedPhases,
  totalPhases: site?.totalPhases,
  updatedAt: site?.updatedAt,
});

const mapSiteDetailsData = (
  site: {
    _id: { toString: () => any };
    name: any;
    address: any;
    city: any;
    state: any;
    zip: any;
    status: any;
    phases: any[];
    budget: any;
    expenses: any;
    supervisionPercentage: any;
    transactions: Transaction[];
    documents: any;
    createdAt: any;
    updatedAt: any;
  },
  client: {
    _id: { toString: () => any };
    name: any;
    email: any;
    role: any;
    isEmailVerified: any;
    isKYCCompleted: any;
    isBlocked: any;
    isAdmin: any;
  },
  siteManagers: any[],
  supervisors: any[],
  architects: any[]
) => ({
  id: site?._id.toString(),
  name: site?.name,
  address: site?.address,
  city: site?.city,
  state: site?.state,
  zip: site?.zip,
  siteManagers:
    siteManagers?.map((sm: any) => ({
      id: sm?._id.toString(),
      name: sm?.name,
      email: sm?.email,
      role: sm?.role,
    })) || [],
  architects:
    architects?.map((a: any) => ({
      id: a?._id.toString(),
      name: a?.name,
      email: a?.email,
      role: a?.role,
    })) || [],
  supervisors:
    supervisors?.map((s: any) => ({
      id: s?._id.toString(),
      name: s?.name,
      email: s?.email,
      role: s?.role,
    })) || [],
  client: {
    id: client?._id?.toString(),
    name: client?.name,
    email: client?.email,
    role: client?.role,
    isEmailVerified: client?.isEmailVerified,
    isKYCCompleted: client?.isKYCCompleted,
    isBlocked: client?.isBlocked,
    isAdmin: client?.isAdmin,
  },
  status: site?.status,
  phases: site?.phases?.map((p: any) => ({
    id: p?._id?.toString(),
    name: p?.name,
    status: p?.status,
    completionDate: p?.completionDate,
  })),
  transactions:
    site?.transactions?.map((t: any) => ({
      id: t?._id.toString(),
      date: t?.date,
      amount: t?.amount,
      type: t?.type,
      description: t?.description,
      relatedId: t?.relatedId?.toString(),
      user: t?.user
        ? {
            id: t?.user._id?.toString(),
            name: t?.user.name,
          }
        : undefined,
    })) || [],
  documents: site?.documents?.map((doc: any) => ({
    id: doc?._id.toString(),
    name: doc?.name,
    size: doc?.size,
    type: doc?.type,
    uploadDate: doc?.uploadDate,
    url: doc?.url,
    uploadedBy: {
      id: doc?.uploadedBy._id.toString(),
      name: doc?.uploadedBy.name,
    },
    category: doc?.category,
  })),
  budget: site?.budget || 0,
  expenses: site?.expenses || 0,
  supervisionPercentage: site?.supervisionPercentage || 0,
  createdAt: site?.createdAt,
  updatedAt: site?.updatedAt,
});

const SITES_CACHE_PREFIX = "sites";
const SITES_FULL_LIST_CACHE_KEY = "sites:full-list";
const SITES_STATS_CACHE_KEY = "sites:stats";
const SITES_CACHE_TTL_MS = 60_000;

export interface SiteStats {
  totalSites: number;
  totalBudget: number;
  completedSites: number;
  activeSites: number;
  statuses: string[];
}

export const getSiteStats = async (): Promise<SiteStats> => {
  return withCache(SITES_STATS_CACHE_KEY, SITES_CACHE_TTL_MS, async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const local = await offlineDB.sites.toArray();
      const completed = local.filter((s) => s.status === "Completed").length;
      const active = local.filter((s) => s.status === "InProgress" || s.status === "active").length;
      const totalBudget = local.reduce((acc, s) => acc + (s.budget || 0), 0);
      return {
        totalSites: local.length,
        totalBudget,
        completedSites: completed,
        activeSites: active,
        statuses: ["InProgress", "Completed"],
      };
    }

    try {
      const response = await privateClient?.get("/sites/stats", {
        withCredentials: true,
      });
      return (
        response.data || {
          totalSites: 0,
          totalBudget: 0,
          completedSites: 0,
          activeSites: 0,
          statuses: ["InProgress", "Completed"],
        }
      );
    } catch {
      const local = await offlineDB.sites.toArray();
      const completed = local.filter((s) => s.status === "Completed").length;
      const active = local.filter((s) => s.status === "InProgress" || s.status === "active").length;
      const totalBudget = local.reduce((acc, s) => acc + (s.budget || 0), 0);
      return {
        totalSites: local.length,
        totalBudget,
        completedSites: completed,
        activeSites: active,
        statuses: ["InProgress", "Completed"],
      };
    }
  });
};

export const getSites = async () => {
  return withCache(SITES_FULL_LIST_CACHE_KEY, SITES_CACHE_TTL_MS, async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const local = await offlineDB.sites.toArray();
      if (local && local.length > 0) return local;
    }

    try {
      const response = await privateClient?.get("/sites", { withCredentials: true });
      const mapped = response.data?.map(mapSiteData) || [];
      for (const s of mapped) {
        if (s.id) {
          offlineDB.sites.put({ ...s, syncStatus: "synced" }).catch(() => {});
        }
      }
      return mapped;
    } catch (err) {
      const local = await offlineDB.sites.toArray();
      if (local && local.length > 0) return local;
      throw err;
    }
  });
};

export interface PaginatedSitesResult {
  sites: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getSitesPaginated = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): Promise<PaginatedSitesResult> => {
  const cacheKey = `sites:paginated:p${params.page}:l${params.limit}:s${params.search || ""}:st${params.status || ""}`;
  return withCache(cacheKey, SITES_CACHE_TTL_MS, async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      let local = await offlineDB.sites.toArray();
      if (params.search) {
        const term = params.search.toLowerCase();
        local = local.filter((s) => s.name?.toLowerCase().includes(term));
      }
      if (params.status && params.status !== "All Statuses") {
        local = local.filter((s) => s.status === params.status);
      }
      return {
        sites: local,
        total: local.length,
        page: 1,
        limit: params.limit,
        totalPages: Math.ceil(local.length / params.limit) || 1,
      };
    }

    try {
      const response = await privateClient?.get("/sites", {
        withCredentials: true,
        params: {
          page: params.page,
          limit: params.limit,
          ...(params.search ? { search: params.search } : {}),
          ...(params.status ? { status: params.status } : {}),
        },
      });
      const mapped = (response.data?.sites || []).map(mapSiteData);
      for (const s of mapped) {
        if (s.id) {
          offlineDB.sites.put({ ...s, syncStatus: "synced" }).catch(() => {});
        }
      }
      return {
        sites: mapped,
        total: response.data?.total || 0,
        page: response.data?.page || params.page,
        limit: response.data?.limit || params.limit,
        totalPages: response.data?.totalPages || 1,
      };
    } catch (err) {
      let local = await offlineDB.sites.toArray();
      if (params.search) {
        const term = params.search.toLowerCase();
        local = local.filter((s) => s.name?.toLowerCase().includes(term));
      }
      if (params.status && params.status !== "All Statuses") {
        local = local.filter((s) => s.status === params.status);
      }
      return {
        sites: local,
        total: local.length,
        page: 1,
        limit: params.limit,
        totalPages: Math.ceil(local.length / params.limit) || 1,
      };
    }
  });
};

export const getSiteDetails = async (siteId: string) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const cached = await offlineDB.sites.get(siteId);
    if (cached) return cached;
  }

  try {
    const response = await privateClient?.get(`/sites/${siteId}`);
    const mapped = mapSiteDetailsData(
      response.data?.site,
      response.data?.client,
      response.data?.siteManagers,
      response.data?.supervisors,
      response.data?.architects
    );
    if (mapped?.id) {
      offlineDB.sites.put({ ...mapped, syncStatus: "synced" }).catch(() => {});
    }
    return mapped;
  } catch (err) {
    const cached = await offlineDB.sites.get(siteId);
    if (cached) return cached;
    throw err;
  }
};

export const createSite = async (siteData: any) => {
  const response = await privateClient?.post("/sites", siteData);
  const { siteId } = response.data;
  const fullSite = await getSiteDetails(siteId);
  invalidateCache(SITES_CACHE_PREFIX);
  return fullSite;
};

export const updateSite = async (siteId: string, updateData: any) => {
  await privateClient?.put("/sites", { siteId, ...updateData });
  invalidateCache(SITES_CACHE_PREFIX);
  return { siteId, ...updateData };
};

export const updatePhaseStatus = async (
  siteId: string,
  phaseId: string,
  status: string
) => {
  await privateClient?.put(`/sites/${siteId}/phases/${phaseId}/status`, {
    status,
  });
  invalidateCache(SITES_CACHE_PREFIX);
};

export const uploadDocument = async (siteId: string, formData: FormData) => {
  await privateClient?.post(`/sites/${siteId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  invalidateCache(SITES_CACHE_PREFIX);
};

export const markSiteAsCompleted = async (
  siteId: string,
  deleteSiteDocuments: boolean,
  deletePurchaseBills: boolean
) => {
  await privateClient?.post(`/sites/${siteId}/mark-as-completed`, {
    deleteSiteDocuments,
    deletePurchaseBills,
  });
  invalidateCache(SITES_CACHE_PREFIX);
};

export const updateSupervisionPercentage = async (
  siteId: string,
  supervisionPercentage: number
) => {
  const response = await privateClient?.patch(
    `/sites/${siteId}/supervision-percentage`,
    { supervisionPercentage }
  );
  invalidateCache(SITES_CACHE_PREFIX);
  return response.data;
};

export interface SiteBudgetAnalysis {
  siteId: string;
  siteName: string;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  averageMonthlyBurnRate: number;
  estimatedMonthsRemaining: number;
  healthStatus: "on_track" | "warning" | "exceeded";
  activeMonths: number;
  breakdown: {
    purchases: number;
    purchasesPaid: number;
    purchasesPending: number;
    miscellaneous: number;
    contractor: number;
    attendance: number;
    unaccounted: number;
  };
  categoryBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthlyTrends: Array<{
    key: string;
    month: string;
    purchases: number;
    contractor: number;
    miscellaneous: number;
    attendance: number;
    other: number;
    monthlySpend: number;
    cumulativeSpend: number;
    plannedSpend: number;
  }>;
  topCostDrivers: Array<{
    name: string;
    quantity: number;
    unit: string;
    totalAmount: number;
  }>;
}

export const getSiteBudgetAnalysis = async (siteId: string): Promise<SiteBudgetAnalysis> => {
  const response = await privateClient.get(`/sites/${siteId}/budget-analysis`);
  return response.data;
};