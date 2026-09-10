import { privateClient } from "@/api";

export interface LenderHistory {
  _id: string;
  type: "borrow" | "settlement";
  amount: number;
  date: string;
  notes?: string;
  transactionId?: string;
}

export interface Lender {
  _id: string;
  name: string;
  phone?: string;
  notes?: string;
  totalLended: number;
  totalSettled: number;
  outstandingBalance: number;
  history: LenderHistory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyTransaction {
  _id: string;
  date: string;
  amount: number;
  type: "expenditure" | "incoming" | "reversal";
  description?: string;
  site?: { _id: string; name: string } | null;
  isCapitalInfusion?: boolean;
  capitalType?: "own" | "lended";
  lender?: { _id: string; name: string; phone?: string } | null;
  lenderName?: string;
  settlementFor?: { _id: string; name: string; phone?: string } | null;
}

export interface CompanySummary {
  totalAmount: number;
  transactions: CompanyTransaction[];
}

export interface AddFundsPayload {
  amount: number;
  notes?: string;
  isCapitalInfusion?: boolean;
  capitalType?: "own" | "lended";
  lenderId?: string;
  newLenderName?: string;
  lenderPhone?: string;
}

export const getCompanySummary = async (): Promise<CompanySummary> => {
  const response = await privateClient.get("/company/summary");
  return response.data;
};

export const addCompanyFunds = async (
  amountOrPayload: number | AddFundsPayload,
  notes?: string,
): Promise<{ totalAmount: number; lender?: Lender }> => {
  const payload =
    typeof amountOrPayload === "number"
      ? { amount: amountOrPayload, notes }
      : amountOrPayload;
  const response = await privateClient.post("/company/add-funds", payload);
  return response.data;
};

export const getLenders = async (): Promise<Lender[]> => {
  const response = await privateClient.get("/company/lenders");
  return response.data;
};

export const getLenderById = async (id: string): Promise<Lender> => {
  const response = await privateClient.get(`/company/lenders/${id}`);
  return response.data;
};

export const settleLender = async (
  lenderId: string,
  amount: number | { amount: number; notes?: string; date?: string },
  notes?: string,
): Promise<{ message: string; lender: Lender; totalAmount: number }> => {
  const payload =
    typeof amount === "object"
      ? { lenderId, amount: amount.amount, notes: amount.notes }
      : { lenderId, amount, notes };

  const response = await privateClient.post("/company/lenders/settle", payload);
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