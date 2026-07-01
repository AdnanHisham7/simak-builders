import { Types } from "mongoose";

export interface Item {
  name: string;
  normalizedName: string;
  category?: string;
  defaultUnit?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}