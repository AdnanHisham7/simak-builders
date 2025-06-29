import { privateClient } from "@/api";

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; balance: number }[];
}

export interface ContractorTransaction {
  id: string;
  contractor: string;
  site: { id: string; name: string };
  type: "advance" | "expense" | "additional_payment";
  amount: number;
  description: string;
  date: string;
  createdBy: { id: string; name: string };
}

export const getAllContractors = async (): Promise<Contractor[]> => {
  const response = await privateClient.get("/contractors");
  return response.data.map((contractor: any) => ({
    id: contractor._id,
    name: contractor.name,
    email: contractor.email,
    phone: contractor.phone,
    company: contractor.company,
    status: contractor.status,
    siteAssignments: contractor.siteAssignments.map((assignment: any) => ({
      site: { id: assignment.site._id, name: assignment.site.name },
      balance: assignment.balance,
    })),
  }));
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

export const assignSiteToContractor = async (contractorId: string, siteId: string): Promise<void> => {
  await privateClient.post("/contractors/assign-site", { contractorId, siteId });
};

export const addTransaction = async (data: {
  contractorId: string;
  siteId: string;
  type: "advance" | "expense" | "additional_payment";
  amount: number;
  description: string;
}): Promise<{ transaction: ContractorTransaction; updatedContractor: Contractor }> => {
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
      createdBy: { id: transaction.createdBy, name: transaction.createdByName || "" },
    },
    updatedContractor: {
      id: updatedContractor._id,
      name: updatedContractor.name,
      email: updatedContractor.email,
      phone: updatedContractor.phone,
      company: updatedContractor.company,
      status: updatedContractor.status,
      siteAssignments: updatedContractor.siteAssignments.map((assignment: any) => ({
        site: { id: assignment.site._id || assignment.site, name: assignment.site.name || "" },
        balance: assignment.balance,
      })),
    },
  };
};

export const getContractorTransactions = async (
  contractorId: string,
  siteId: string
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
    description: tx.description,
    date: tx.date,
    createdBy: { id: tx.createdBy._id, name: tx.createdBy.name },
  }));
};