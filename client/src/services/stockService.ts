import { privateClient } from "@/api";
import { withCache, invalidateCache } from "@/helpers/requestCache";

const STOCKS_FULL_LIST_CACHE_KEY = "stocks-full-list";
const STOCKS_FULL_LIST_CACHE_TTL_MS = 15_000;

export interface Stock {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  averagePrice?: number;
  site?: { _id: string; name: string };
}

export interface StockTransfer {
  _id: string;
  stock: { _id: string; name: string };
  quantity: number;
  fromSite?: { _id: string; name: string };
  toSite: { _id: string; name: string };
  status: "Requested" | "Approved" | "Rejected";
  approvedBy?: { _id: string; username: string };
  rejectedBy?: { _id: string; username: string };
}

export interface StockUsage {
  _id: string;
  stock: { _id: string; name: string };
  site: { _id: string; name: string };
  quantity: number;
  usageDate: string;
  loggedBy?: { _id: string; name: string };
}

export const getStocks = async (): Promise<Stock[]> => {
  return withCache(STOCKS_FULL_LIST_CACHE_KEY, STOCKS_FULL_LIST_CACHE_TTL_MS, async () => {
    const response = await privateClient.get(`/stocks`);
    return response.data;
  });
};

export interface PaginatedStocksResult {
  stocks: Stock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getStocksPaginated = async (params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  site?: string;
}): Promise<PaginatedStocksResult> => {
  const response = await privateClient.get(`/stocks`, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.site ? { site: params.site } : {}),
    },
  });
  return {
    stocks: response.data?.stocks || [],
    total: response.data?.total || 0,
    page: response.data?.page || params.page,
    limit: response.data?.limit || params.limit,
    totalPages: response.data?.totalPages || 1,
  };
};

export const getStocksBySite = async (siteId: string): Promise<Stock[]> => {
  const response = await privateClient.get(`/stocks/by-site`, {
    params: { siteId },
  });
  return response.data;
};

export const addStock = async (stockData: {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  averagePrice?: number;
  site?: string;
}): Promise<Stock> => {
  const response = await privateClient.post(`/stocks`, stockData);
  invalidateCache(STOCKS_FULL_LIST_CACHE_KEY);
  return response.data;
};

export const requestStockTransfer = async (transferData: {
  stock: string;
  quantity: number;
  fromSite?: string;
  toSite: string;
}): Promise<StockTransfer> => {
  const response = await privateClient.post(`/stocks/transfers`, transferData);
  return response.data;
};

export const approveStockTransfer = async (
  transferId: string,
): Promise<StockTransfer> => {
  const response = await privateClient.patch(
    `/stocks/transfers/${transferId}/approve`,
    {},
  );
  invalidateCache(STOCKS_FULL_LIST_CACHE_KEY);
  return response.data;
};

export const rejectStockTransfer = async (
  transferId: string,
): Promise<StockTransfer> => {
  const response = await privateClient.patch(
    `/stocks/transfers/${transferId}/reject`,
    {},
  );
  return response.data;
};

export const getStockTransfers = async (
  status: string | null = null,
): Promise<StockTransfer[]> => {
  const response = await privateClient.get(`/stocks/transfers`, {
    params: { status },
  });
  return response.data;
};

export const logStockUsage = async (usageData: {
  stock: string;
  site: string;
  quantity: number;
  usageDate?: string;
}): Promise<StockUsage> => {
  const response = await privateClient.post(`/stocks/usages`, usageData);
  invalidateCache(STOCKS_FULL_LIST_CACHE_KEY);
  return response.data;
};

export const getStockUsages = async (
  siteId: string | null = null,
): Promise<StockUsage[]> => {
  const response = await privateClient.get(`/stocks/usages`, {
    params: { siteId },
  });
  return response.data;
};
