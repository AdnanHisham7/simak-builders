import { privateClient } from "@/api";

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
  const response = await privateClient.get("/vendors");
  console.log("vennddddddddddoooooooorrr",response)
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
};

export const getPurchasesByVendor = async (
  vendorId: string
): Promise<Purchase[]> => {
  const response = await privateClient.get(`/vendors/${vendorId}/purchases`);
  return response.data;
};

export const settleVendorPayments = async (vendorId: string): Promise<void> => {
  await privateClient.patch(`/vendors/${vendorId}/settle`);
};
