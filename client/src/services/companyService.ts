import { privateClient } from "@/api";

export interface CompanyTransaction {
  _id: string;
  date: string;
  amount: number;
  type: "expenditure" | "incoming" | "reversal";
  description?: string;
  site?: { _id: string; name: string } | null;
}

export interface CompanySummary {
  totalAmount: number;
  transactions: CompanyTransaction[];
}

export const getCompanySummary = async (): Promise<CompanySummary> => {
  const response = await privateClient.get("/company/summary");
  return response.data;
};

export const addCompanyFunds = async (
  amount: number,
  notes?: string,
): Promise<{ totalAmount: number }> => {
  const response = await privateClient.post("/company/add-funds", {
    amount,
    notes,
  });
  return response.data;
};

export interface SiteReceivable {
  siteId: string;
  siteName: string;
  clientName: string;
  expenses: number;
  amountReceived: number;
  amountToBeReceived: number;
}

export interface AmountToBeReceivedSummary {
  total: number;
  bySite: SiteReceivable[];
}

export const getAmountToBeReceived =
  async (): Promise<AmountToBeReceivedSummary> => {
    const response = await privateClient.get("/company/amount-to-be-received");
    return response.data;
  };