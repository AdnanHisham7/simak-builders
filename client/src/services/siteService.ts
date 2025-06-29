import { privateClient } from "@/api";

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
  type: "purchase" | "rental" | "attendance" | "stockTransfer";
  description?: string;
  relatedId?: string;
  user?: { id: string; name: string };
}

export interface Site {
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
  transactions: Transaction[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

const mapSiteData = (site: any) => ({
  id: site._id.toString(),
  name: site.name,
  address: site.address,
  city: site.city,
  state: site.state,
  zip: site.zip,
  siteManagers:
    site.siteManagers?.map((sm: any) => ({
      id: sm._id.toString(),
      name: sm.name,
      email: sm.email,
      role: sm.role,
    })) || [],
  architects:
    site.architects?.map((a: any) => ({
      id: a._id.toString(),
      name: a.name,
      email: a.email,
      role: a.role,
    })) || [],
  supervisors:
    site.supervisors?.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      role: s.role,
    })) || [],
  client: site.client
    ? {
        id: site.client._id.toString(),
        name: site.client.name,
        email: site.client.email,
        role: site.client.role,
        isEmailVerified: site.client.isEmailVerified,
        isKYCCompleted: site.client.isKYCCompleted,
        isBlocked: site.client.isBlocked,
        isAdmin: site.client.isAdmin,
      }
    : null,
  status: site.status,
  phases: site.phases.map((p: any) => ({
    id: p._id?.toString(),
    name: p.name,
    status: p.status,
    completionDate: p.completionDate,
  })),
  budget: site.budget || 0,
  expenses: site.expenses || 0,
  documents: site.documents.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.name,
    size: doc.size,
    type: doc.type,
    uploadDate: doc.uploadDate,
    url: doc.url,
    uploadedBy: {
      id: doc.uploadedBy._id.toString(),
      name: doc.uploadedBy.name,
    },
    category: doc.category,
  })),
  transactions:
    site.transactions?.map((t: any) => ({
      id: t._id.toString(),
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description,
      relatedId: t.relatedId?.toString(),
      user: t.user
        ? {
            id: t.user._id?.toString(),
            name: t.user.name,
          }
        : undefined,
    })) || [],
  createdAt: site.createdAt,
  siteManagerCount: site.siteManagerCount,
  architectCount: site.architectCount,
  completedPhases: site.completedPhases,
  totalPhases: site.totalPhases,
  updatedAt: site.updatedAt,
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
  id: site._id.toString(),
  name: site.name,
  address: site.address,
  city: site.city,
  state: site.state,
  zip: site.zip,
  siteManagers:
    siteManagers?.map((sm: any) => ({
      id: sm._id.toString(),
      name: sm.name,
      email: sm.email,
      role: sm.role,
    })) || [],
  architects:
    architects?.map((a: any) => ({
      id: a._id.toString(),
      name: a.name,
      email: a.email,
      role: a.role,
    })) || [],
  supervisors:
    supervisors?.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      role: s.role,
    })) || [],
  client: {
    id: client._id?.toString(),
    name: client.name,
    email: client.email,
    role: client.role,
    isEmailVerified: client.isEmailVerified,
    isKYCCompleted: client.isKYCCompleted,
    isBlocked: client.isBlocked,
    isAdmin: client.isAdmin,
  },
  status: site.status,
  phases: site.phases.map((p: any) => ({
    id: p._id?.toString(),
    name: p.name,
    status: p.status,
    completionDate: p.completionDate,
  })),
  transactions:
    site.transactions?.map((t: any) => ({
      id: t._id.toString(),
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description,
      relatedId: t.relatedId?.toString(),
      user: t.user
        ? {
            id: t.user._id?.toString(),
            name: t.user.name,
          }
        : undefined,
    })) || [],
  documents: site.documents.map((doc: any) => ({
    id: doc._id.toString(),
    name: doc.name,
    size: doc.size,
    type: doc.type,
    uploadDate: doc.uploadDate,
    url: doc.url,
    uploadedBy: {
      id: doc.uploadedBy._id.toString(),
      name: doc.uploadedBy.name,
    },
    category: doc.category,
  })),
  budget: site.budget || 0,
  expenses: site.expenses || 0,
  createdAt: site.createdAt,
  updatedAt: site.updatedAt,
});

export const getSites = async () => {
  const response = await privateClient.get("/sites", { withCredentials: true });
  console.log("LOLOLOLresponse", response.data);
  return response.data.map(mapSiteData);
};

export const getSiteDetails = async (siteId: string) => {
  const response = await privateClient.get(`/sites/${siteId}`);
  console.log("responseresponseresponseresponse", response);
  return mapSiteDetailsData(
    response.data.site,
    response.data.client,
    response.data.siteManagers,
    response.data.supervisors,
    response.data.architects
  );
};

export const createSite = async (siteData: any) => {
  const response = await privateClient.post("/sites", siteData);
  const { siteId } = response.data;
  const fullSite = await getSiteDetails(siteId);
  return fullSite;
};

export const updateSite = async (siteId: string, updateData: any) => {
  const response = await privateClient.put("/sites", { siteId, ...updateData });
  return { siteId, ...updateData };
};

export const updatePhaseStatus = async (
  siteId: string,
  phaseId: string,
  status: string
) => {
  await privateClient.put(`/sites/${siteId}/phases/${phaseId}/status`, {
    status,
  });
};

export const uploadDocument = async (siteId: string, formData: FormData) => {
  await privateClient.post(`/sites/${siteId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const markSiteAsCompleted = async (
  siteId: string,
  deleteSiteDocuments: boolean,
  deletePurchaseBills: boolean
) => {
  await privateClient.post(`/sites/${siteId}/mark-as-completed`, {
    deleteSiteDocuments,
    deletePurchaseBills,
  });
};