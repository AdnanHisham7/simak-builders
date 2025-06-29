import { privateClient } from "@/api";
import { Enquiry } from "@/store/types/enquiry";

const API_URL = "/enquiries";

export const getEnquiries = async (): Promise<Enquiry[]> => {
  const response = await privateClient.get(API_URL);
  return response.data;
};

export const getEnquiryById = async (id: string): Promise<Enquiry> => {
  const response = await privateClient.get(`${API_URL}/${id}`);
  return response.data;
};

export const createEnquiry = async (
  enquiry: Omit<Enquiry, "_id" | "createdAt" | "updatedAt">
): Promise<Enquiry> => {
  const response = await privateClient.post(API_URL, enquiry);
  return response.data;
};

export const markEnquiryAsSeen = async (id: string): Promise<Enquiry> => {
  const response = await privateClient.post(`${API_URL}/${id}/seen`);
  return response.data;
};

export const getUnseenEnquiriesCount = async (): Promise<number> => {
  const response = await privateClient.get(`${API_URL}/unseen-count`);
  return response.data.count;
};