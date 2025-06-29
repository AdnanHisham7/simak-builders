import { privateClient } from "@/api";

export const getClientDashboard = async (params = {}) => {
  const response = await privateClient.get("/client/dashboard", { params });
  return response.data;
};

export const getClientSites = async () => {
  const response = await privateClient.get("/client/sites");
  return response.data;
};

export const sendMoneyToAdmin = async (amount: number, siteId: string) => {
  const response = await privateClient.post("/client/send-money", { amount, siteId });
  return response.data;
};