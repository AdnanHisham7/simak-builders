import { Types } from "mongoose";

export interface StockTransfer {
  stock: Types.ObjectId;
  quantity: number;
  fromSite?: Types.ObjectId;
  toSite: Types.ObjectId;
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId  | string;
  status?: "Requested" | "Approved" | "Rejected";
  rejectedBy?:string;
  createdAt?: Date;
  updatedAt?: Date;
}
