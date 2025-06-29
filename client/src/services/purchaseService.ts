import { privateClient } from "@/api";

export const addPurchase = async (purchaseData) => {
  const response = await privateClient.post(`/purchases`, purchaseData);
  return response.data;
};

export const verifyPurchase = async (purchaseId) => {
  console.log(purchaseId, "dfhfhdfdhfjdhfdj");
  const response = await privateClient.patch(
    `/purchases/${purchaseId}/verify`,
    {}
  );
  return response.data;
};

export const getPurchases = async (siteId = null, status = null) => {
  const response = await privateClient.get(`/purchases`);
  return response.data;
};

export const getPurchasesBySite = async (siteId: string, status = null) => {
  const response = await privateClient.get(`/purchases/by-site`, {
    params: { siteId, status },
  });
  return response.data;
};

export const deleteBillUpload = async (purchaseId: string) => {
  await privateClient.delete(`/purchases/${purchaseId}/billUpload`);
};
