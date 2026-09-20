import { Types } from "mongoose";

export interface Stock {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  site?: Types.ObjectId;
  averagePrice?: number;
  lowStockThreshold?: number;
  lastAlertSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}