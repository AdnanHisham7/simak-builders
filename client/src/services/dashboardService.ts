import { privateClient } from "@/api";

export interface ActivityLogUser {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
}

export interface ActivityLogItem {
  _id: string;
  user?: ActivityLogUser | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ip?: string;
  device?: string;
  userAgent?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLogQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  resource?: string;
  action?: string;
  search?: string;
  limit?: number;
}

export const getDashboardData = async () => {
  const response = await privateClient.get("/company/dashboard");
  return response.data;
};

export const getAllActivityLogs = async (
  params?: ActivityLogQueryParams,
): Promise<ActivityLogItem[]> => {
  const response = await privateClient.get("/company/activity-logs", { params });
  return response.data;
};