import { privateClient } from "@/api";

export type FeedbackCategory =
  | "quality"
  | "timeline"
  | "communication"
  | "budget"
  | "safety"
  | "other";

export type FeedbackStatus = "open" | "in_review" | "resolved";

export interface Feedback {
  _id: string;
  client: { _id: string; name: string; email: string } | string;
  site: { _id: string; name: string } | string;
  category: FeedbackCategory;
  rating: number;
  message: string;
  status: FeedbackStatus;
  adminResponse: string;
  respondedBy?: { _id: string; name: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFeedback {
  data: Feedback[];
  total: number;
  page: number;
  limit: number;
  openCount?: number;
}

export const submitFeedback = async (payload: {
  siteId: string;
  rating: number;
  message: string;
  category: FeedbackCategory;
}): Promise<Feedback> => {
  const response = await privateClient.post("/feedback", payload);
  return response.data.feedback;
};

export const getMyFeedback = async (
  params: {
    siteId?: string;
    status?: FeedbackStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedFeedback> => {
  const response = await privateClient.get("/feedback/mine", { params });
  return response.data;
};

export const getAllFeedback = async (
  params: {
    siteId?: string;
    status?: FeedbackStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedFeedback> => {
  const response = await privateClient.get("/feedback", { params });
  return response.data;
};

export const respondToFeedback = async (
  feedbackId: string,
  payload: { response?: string; status: FeedbackStatus },
): Promise<Feedback> => {
  const response = await privateClient.put(
    `/feedback/${feedbackId}/respond`,
    payload,
  );
  return response.data.feedback;
};

export const getOpenFeedbackCount = async (): Promise<number> => {
  const response = await privateClient.get("/feedback/open-count");
  return response.data.count;
};