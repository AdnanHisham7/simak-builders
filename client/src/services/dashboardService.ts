import { privateClient } from "@/api";

export const getDashboardData = async () => {
  const response = await privateClient.get("/company/dashboard");
  return response.data;
};

export const getAllActivityLogs = async () => {
  const response = await privateClient.get("/company/activity-logs");
  return response.data;
};