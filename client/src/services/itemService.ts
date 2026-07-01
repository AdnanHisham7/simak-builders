import { privateClient } from "@/api";

export interface ItemSuggestion {
  _id: string;
  name: string;
  category?: string;
  defaultUnit?: string;
}

export const searchItems = async (query: string): Promise<ItemSuggestion[]> => {
  const response = await privateClient.get("/items/search", {
    params: { q: query },
  });
  return response.data;
};

export const getAllItems = async (): Promise<ItemSuggestion[]> => {
  const response = await privateClient.get("/items");
  return response.data;
};