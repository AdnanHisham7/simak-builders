import { privateClient } from "@/api";
import {
  localAddPurchase,
  localGetPurchasesBySite,
} from "@/offline/repositories/purchaseRepository";

export const addPurchase = async (purchaseData: any) => {
  return localAddPurchase(purchaseData);
};

export const verifyPurchase = async (purchaseId: string) => {
  const response = await privateClient.patch(
    `/purchases/${purchaseId}/verify`,
    {},
  );
  return response.data;
};

export const updatePurchaseItem = async (
  purchaseId: string,
  itemIndex: number,
  data: { name: string; category: string },
) => {
  const response = await privateClient.patch(
    `/purchases/${purchaseId}/items/${itemIndex}`,
    data,
  );
  return response.data;
};

export const getPurchases = async (siteId = null, status = null) => {
  const response = await privateClient.get(`/purchases`);
  return response.data;
};

export const getPurchasesBySite = async (siteId: string, status: any = null) => {
  return localGetPurchasesBySite(siteId, status);
};

export const getPurchaseById = async (purchaseId: string) => {
  const response = await privateClient.get(`/purchases/${purchaseId}`);
  return response.data;
};

export const deleteBillUpload = async (purchaseId: string) => {
  await privateClient.delete(`/purchases/${purchaseId}/billUpload`);
};

export const deletePurchase = async (purchaseId: string) => {
  const response = await privateClient.delete(`/purchases/${purchaseId}`);
  return response.data;
};