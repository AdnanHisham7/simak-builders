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

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  description: string;
}

export const getCompanyProfile = async (): Promise<CompanyProfile> => {
  const response = await privateClient.get("/company/profile");
  return response.data;
};

export type CompanyProfileUpdatePayload = Partial<
  Omit<CompanyProfile, "id" | "logo">
> & { logo?: File };

export const updateCompanyProfile = async (
  payload: CompanyProfileUpdatePayload,
): Promise<CompanyProfile> => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (key === "logo" && value instanceof File) {
      formData.append("logo", value);
    } else if (key !== "logo") {
      formData.append(key, String(value));
    }
  });

  const response = await privateClient.put("/company/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.company;
};