import { Types } from "mongoose";

export interface Item {
  name: string;
  normalizedName: string;
  category?: string;
  defaultUnit?: string;
  lowStockThreshold?: number;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}