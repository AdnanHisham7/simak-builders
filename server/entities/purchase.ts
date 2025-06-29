import { Types } from "mongoose";

export interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: number;
  price: number;
}

export interface BillUpload {
  name?: string;
  size?: number;
  type?: string;
  uploadDate?: string;
  url?: string;
}

export interface Payment {
  method: "cash" | "credit";
  isPaid?: boolean;
}

export interface Purchase {
  site?: Types.ObjectId;
  vendor: Types.ObjectId;
  items: PurchaseItem[];
  totalAmount: number;
  billUpload?: BillUpload;
  addedBy: Types.ObjectId;
  status?: "pending" | "verified";
  payment: Payment;
  createdAt?: Date;
  updatedAt?: Date;
}
