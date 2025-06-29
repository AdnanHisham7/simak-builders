import { Types } from "mongoose";

export interface StockTransfer {
  stock: Types.ObjectId;
  quantity: number;
  fromSite?: Types.ObjectId;
  toSite: Types.ObjectId;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  status?: "Requested" | "Approved";
  createdAt?: Date;
  updatedAt?: Date;
}
