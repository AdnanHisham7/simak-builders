import { ItemModel } from "@models/Item";
import { Types } from "mongoose";

export const normalizeItemName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const similarityScore = (query: string, candidate: string): number => {
  if (!query) return 0;
  if (candidate === query) return 1000;
  if (candidate.startsWith(query)) return 500 - candidate.length;
  if (candidate.includes(query)) return 300 - candidate.length;

  const distance = levenshtein(query, candidate);
  const maxLen = Math.max(query.length, candidate.length);
  const normalizedDistance = maxLen === 0 ? 1 : distance / maxLen;
  if (normalizedDistance > 0.5) return -1;
  return 100 - normalizedDistance * 100;
};

export interface ItemSuggestion {
  _id: string;
  name: string;
  category?: string;
  defaultUnit?: string;
}

export const searchItemSuggestions = async (
  query: string,
  limit = 8
): Promise<ItemSuggestion[]> => {
  const normalizedQuery = normalizeItemName(query || "");
  if (!normalizedQuery) {
    const items = await ItemModel.find({}).sort({ name: 1 }).limit(limit);
    return items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      category: item.category,
      defaultUnit: item.defaultUnit,
    }));
  }

  const allItems = await ItemModel.find({}).limit(2000);

  const scored = allItems
    .map((item) => ({
      item,
      score: similarityScore(normalizedQuery, item.normalizedName),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ item }) => ({
    _id: item._id.toString(),
    name: item.name,
    category: item.category,
    defaultUnit: item.defaultUnit,
  }));
};

export const resolveItem = async (
  rawName: string,
  category?: string,
  unit?: string,
  createdBy?: string
): Promise<{ canonicalName: string; itemId: Types.ObjectId }> => {
  const trimmedName = (rawName || "").trim();
  if (!trimmedName) {
    throw new Error("Item name is required");
  }
  const normalizedName = normalizeItemName(trimmedName);

  let item = await ItemModel.findOne({ normalizedName });
  if (!item) {
    try {
      item = await ItemModel.create({
        name: trimmedName,
        normalizedName,
        category,
        defaultUnit: unit,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        item = await ItemModel.findOne({ normalizedName });
        if (!item) throw error;
      } else {
        throw error;
      }
    }
  }

  return { canonicalName: item.name, itemId: item._id as Types.ObjectId };
};