import { privateClient } from "@/api";

export const addMiscellaneousExpense = async (data: {
  siteId: string | null;
  name: string;
  category: string;
  tip: number;
  notes: string;
  amount: number;
  sourceOfFunds: "company" | "siteManager";
  deductFromUserId?: string;
  paymentMethod: string;
  vendorId: string | undefined;
  date: string;
}) => {
  const response = await privateClient.post("/miscellaneous-expenses", data);
  return response.data;
};

export const getMiscellaneousExpensesBySite = async (siteId: string) => {
  const response = await privateClient.get(
    `/miscellaneous-expenses/site?siteId=${siteId}`,
  );
  return response.data;
};

export const getMiscellaneousExpenseById = async (expenseId: string) => {
  const response = await privateClient.get(
    `/miscellaneous-expenses/${expenseId}`,
  );
  return response.data;
};

export const verifyMiscellaneousExpense = async (expenseId: string) => {
  const response = await privateClient.patch(
    `/miscellaneous-expenses/${expenseId}/verify`,
  );
  return response.data;
};

export const updateMiscellaneousExpense = async (
  expenseId: string,
  data: { name: string; category: string },
) => {
  const response = await privateClient.patch(
    `/miscellaneous-expenses/${expenseId}`,
    data,
  );
  return response.data;
};

export const deleteMiscellaneousExpense = async (expenseId: string) => {
  const response = await privateClient.delete(
    `/miscellaneous-expenses/${expenseId}`,
  );
  return response.data;
};

export interface MiscellaneousExpenseSuggestion {
  _id: string;
  name: string;
  category: "machinery" | "rental" | "service" | "material";
}

export const getMiscellaneousExpenseSuggestions = async (
  query: string,
  category?: string,
): Promise<MiscellaneousExpenseSuggestion[]> => {
  const response = await privateClient.get("/miscellaneous-expenses/suggestions", {
    params: { q: query, category },
  });
  return response.data;
};