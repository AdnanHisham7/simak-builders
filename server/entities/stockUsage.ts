import { Types } from "mongoose";

export interface StockUsage {
  site: Types.ObjectId | null;
  stock: Types.ObjectId;
  quantity: number;
  usedBy: Types.ObjectId;
  usageDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
