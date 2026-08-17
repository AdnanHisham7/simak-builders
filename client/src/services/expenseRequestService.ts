import { privateClient } from "@/api";

export type ExpenseRequestCategory =
  | "machinery"
  | "rental"
  | "service"
  | "material";

export type ExpenseRequestStatus = "pending" | "approved" | "rejected";

export interface ExpenseRequest {
  _id: string;
  architect: { _id: string; name: string; email: string } | string;
  site: { _id: string; name: string } | string;
  title: string;
  description: string;
  category: ExpenseRequestCategory;
  amount: number;
  status: ExpenseRequestStatus;
  reviewedBy?: { _id: string; name: string };
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedExpenseRequests {
  data: ExpenseRequest[];
  total: number;
  page: number;
  limit: number;
  pendingCount?: number;
}

export const submitExpenseRequest = async (payload: {
  siteId: string;
  title: string;
  description?: string;
  category: ExpenseRequestCategory;
  amount: number;
}): Promise<ExpenseRequest> => {
  const response = await privateClient.post("/expense-requests", payload);
  return response.data.expenseRequest;
};

export const getMyExpenseRequests = async (
  params: {
    siteId?: string;
    status?: ExpenseRequestStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedExpenseRequests> => {
  const response = await privateClient.get("/expense-requests/mine", {
    params,
  });
  return response.data;
};

export const getAllExpenseRequests = async (
  params: {
    siteId?: string;
    status?: ExpenseRequestStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedExpenseRequests> => {
  const response = await privateClient.get("/expense-requests", { params });
  return response.data;
};

export const approveExpenseRequest = async (
  expenseRequestId: string,
): Promise<ExpenseRequest> => {
  const response = await privateClient.patch(
    `/expense-requests/${expenseRequestId}/approve`,
  );
  return response.data.expenseRequest;
};

export const rejectExpenseRequest = async (
  expenseRequestId: string,
  reviewNotes?: string,
): Promise<ExpenseRequest> => {
  const response = await privateClient.patch(
    `/expense-requests/${expenseRequestId}/reject`,
    { reviewNotes },
  );
  return response.data.expenseRequest;
};

export const getPendingExpenseRequestCount = async (): Promise<number> => {
  const response = await privateClient.get("/expense-requests/pending-count");
  return response.data.count;
};