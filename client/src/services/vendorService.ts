import { privateClient } from "@/api";
import { withCache, invalidateCache } from "@/helpers/requestCache";

const VENDORS_FULL_LIST_CACHE_KEY = "vendors-full-list";
const VENDORS_FULL_LIST_CACHE_TTL_MS = 15_000;

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  totalPurchases?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  status?: "active" | "inactive";
}

export interface Purchase {
  _id: string;
  site: {
    _id: string;
    name: string;
  } | null;
  vendor: string;
  items: {
    name: string;
    unit: string;
    category: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  billUpload: {
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    url: string;
  };
  addedBy: string;
  status: "pending" | "verified";
  createdAt: string;
  updatedAt: string;
  payment: {
    method: "cash" | "credit";
    isPaid: boolean;
  };
}

export const getVendors = async (): Promise<Vendor[]> => {
  return withCache(VENDORS_FULL_LIST_CACHE_KEY, VENDORS_FULL_LIST_CACHE_TTL_MS, async () => {
    const response = await privateClient.get("/vendors");
    return response.data.map((vendor: any) => ({
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      totalPurchases: vendor.totalPurchases,
      totalAmount: vendor.totalAmount,
      outstandingAmount: vendor.outstandingAmount,
      status: vendor.status,
    }));
  });
};

export interface PaginatedVendorsResult {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const mapVendor = (vendor: any): Vendor => ({
  id: vendor._id,
  name: vendor.name,
  email: vendor.email,
  phone: vendor.phone,
  createdAt: vendor.createdAt,
  updatedAt: vendor.updatedAt,
  totalPurchases: vendor.totalPurchases,
  totalAmount: vendor.totalAmount,
  outstandingAmount: vendor.outstandingAmount,
  status: vendor.status,
});

export const getVendorsPaginated = async (params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<PaginatedVendorsResult> => {
  const response = await privateClient.get("/vendors", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return {
    vendors: (response.data?.vendors || []).map(mapVendor),
    total: response.data?.total || 0,
    page: response.data?.page || params.page,
    limit: response.data?.limit || params.limit,
    totalPages: response.data?.totalPages || 1,
  };
};

export const getVendorById = async (id: string): Promise<Vendor> => {
  const response = await privateClient.get(`/vendors/${id}`);
  const vendor = response.data;
  return {
    id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
};

export const createVendor = async (data: {
  name: string;
  email: string;
  phone: string;
}): Promise<Vendor> => {
  const response = await privateClient.post("/vendors", data);
  const vendor = response.data;
  invalidateCache(VENDORS_FULL_LIST_CACHE_KEY);
  return {
    id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
};

export const updateVendor = async (
  id: string,
  data: Partial<Omit<Vendor, "id" | "company">> & { company?: string }
): Promise<Vendor> => {
  const response = await privateClient.put(`/vendors/${id}`, data);
  const vendor = response.data;
  invalidateCache(VENDORS_FULL_LIST_CACHE_KEY);
  return {
    id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
};

export const deleteVendor = async (id: string): Promise<void> => {
  await privateClient.delete(`/vendors/${id}`);
  invalidateCache(VENDORS_FULL_LIST_CACHE_KEY);
};

export const getPurchasesByVendor = async (
  vendorId: string
): Promise<Purchase[]> => {
  const response = await privateClient.get(`/vendors/${vendorId}/purchases`);
  return response.data;
};

export const settleVendorPayments = async (
  vendorId: string,
  data: { amount: number; notes?: string },
): Promise<{ settledAmount: number; remainingOutstanding: number }> => {
  const response = await privateClient.patch(`/vendors/${vendorId}/settle`, {
    amount: data.amount,
    notes: data.notes || "",
  });
  invalidateCache(VENDORS_FULL_LIST_CACHE_KEY);
  return response.data;
};