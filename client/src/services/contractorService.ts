import { privateClient } from "@/api";

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
}

export interface ContractorTransaction {
  id: string;
  contractor: string;
  site: { id: string; name: string };
  type: "advance" | "expense" | "additional_payment";
  amount: number;
  description: string;
  date: string;
  addedBy: { id: string; name: string };
}

const mapContractor = (raw: any): Contractor => ({
  id: raw._id,
  name: raw.name,
  email: raw.email,
  phone: raw.phone,
  company: raw.company,
  status: raw.status,
  siteAssignments: (raw.siteAssignments || []).map((assignment: any) => ({
    site: {
      id: assignment.site._id || assignment.site,
      name: assignment.site.name || "",
    },
    totalAmount: assignment.totalAmount,
  })),
});

export const getAllContractors = async (): Promise<Contractor[]> => {
  const response = await privateClient.get("/contractors");
  return response.data.map(mapContractor);
};

export const createContractor = async (data: {
  name: string;
  email: string;
  phone: string;
  company: string;
}): Promise<Contractor> => {
  const response = await privateClient.post("/contractors", data);
  return {
    id: response.data.contractor.id,
    name: response.data.contractor.name,
    email: response.data.contractor.email,
    phone: response.data.contractor.phone,
    company: response.data.contractor.company,
    status: response.data.contractor.status,
    siteAssignments: [],
  };
};

export const assignSiteToContractor = async (
  contractorId: string,
  siteId: string,
): Promise<void> => {
  await privateClient.post("/contractors/assign-site", {
    contractorId,
    siteId,
  });
};

export const addTransaction = async (data: {
  contractorId: string;
  siteId: string;
  type: "advance" | "expense" | "additional_payment";
  amount: number;
  description: string;
}): Promise<{
  transaction: ContractorTransaction;
  updatedContractor: Contractor;
}> => {
  const response = await privateClient.post("/contractors/transactions", data);
  const { transaction, updatedContractor } = response.data;
  return {
    transaction: {
      id: transaction._id,
      contractor: transaction.contractor,
      site: { id: transaction.site, name: transaction.siteName || "" }, // Assuming site populated elsewhere
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      addedBy: {
        id: transaction.addedBy,
        name: transaction.addedByName || "",
      },
    },
    updatedContractor: mapContractor(updatedContractor),
  };
};

export const getContractorTransactions = async (
  contractorId: string,
  siteId: string,
): Promise<ContractorTransaction[]> => {
  const response = await privateClient.get("/contractors/transactions", {
    params: { contractorId, siteId },
  });
  return response.data.map((tx: any) => ({
    id: tx._id,
    contractor: tx.contractor,
    site: { id: tx.site._id, name: tx.site.name },
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
    date: tx.date,
    addedBy: { id: tx.addedBy?._id, name: tx.addedBy?.name },
  }));
};

export const updateContractor = async (
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: "active" | "blocked";
  },
): Promise<Contractor> => {
  const response = await privateClient.put(`/contractors/${id}`, data);
  return {
    id: response.data.contractor.id,
    name: response.data.contractor.name,
    email: response.data.contractor.email,
    phone: response.data.contractor.phone,
    company: response.data.contractor.company,
    status: response.data.contractor.status,
    siteAssignments: [], // Will be updated from main list if needed
  };
};

export const deleteContractor = async (id: string): Promise<void> => {
  await privateClient.delete(`/contractors/${id}`);
};

export const deleteContractorTransaction = async (
  transactionId: string,
): Promise<{ updatedContractor: Contractor }> => {
  const response = await privateClient.delete(
    `/contractors/transactions/${transactionId}`,
  );
  return {
    updatedContractor: mapContractor(response.data.updatedContractor),
  };
};

export const unassignSiteFromContractor = async (
  contractorId: string,
  siteId: string,
): Promise<any> => {
  const response = await privateClient.delete(
    `/contractors/${contractorId}/sites/${siteId}`,
  );
  return response.data;
};