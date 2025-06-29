import { Types } from "mongoose";

export interface Stock {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  site?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
