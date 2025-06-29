// services/machineryRentalService.ts
import { privateClient } from "@/api";

export const addMachineryRental = async (data: { siteId: string | null; description: string; amount: number; date: string }) => {
  const response = await privateClient.post("/machinery-rentals", data);
  return response.data;
};

export const getMachineryRentalsBySite = async (siteId: string) => {
  const response = await privateClient.get(`/machinery-rentals/site?siteId=${siteId}`);
  return response.data;
};

export const verifyMachineryRental = async (rentalId: string) => {
  const response = await privateClient.patch(`/machinery-rentals/${rentalId}/verify`);
  return response.data;
};