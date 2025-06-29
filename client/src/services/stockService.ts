import { privateClient } from "@/api";

export const getStocks = async () => {
  const response = await privateClient.get(`/stocks`);
  return response.data;
};

export const getStocksBySite = async (siteId:string) => {
  const response = await privateClient.get(`/stocks/by-site`, {
    params: { siteId },
  });
  return response.data;
};

export const addStock = async (stockData) => {
  const response = await privateClient.post(`/stocks`, stockData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

export const requestStockTransfer = async (transferData) => {
  const response = await privateClient.post(`/stocks/transfers`, transferData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

export const approveStockTransfer = async (transferId) => {
  const response = await privateClient.patch(
    `/stocks/transfers/${transferId}/approve`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};

export const getStockTransfers = async (status = null) => {
  const response = await privateClient.get(`/stocks/transfers`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    params: { status },
  });
  return response.data;
};

export const logStockUsage = async (usageData) => {
  const response = await privateClient.post(`/stocks/usages`, usageData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

export const getStockUsages = async (siteId = null) => {
  const response = await privateClient.get(`/stocks/usages`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    params: { siteId },
  });
  return response.data;
};

export const rejectStockTransfer = async (transferId) => {
  const response = await privateClient.patch(
    `/stocks/transfers/${transferId}/reject`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};