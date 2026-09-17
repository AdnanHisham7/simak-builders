import { Types } from "mongoose";

export interface PurchaseItem {
  name: string;
  unit: string;
  category: string;
  quantity: number;
  price: number;
  totalAmount?: number;
}

export interface BillUpload {
  name?: string;
  size?: number;
  type?: string;
  uploadDate?: string;
  url?: string;
  public_id?: string;
}

export interface Payment {
  method: "cash" | "credit";
  isPaid?: boolean;
  paidAmount?: number;
}

export interface Purchase {
  _id?: Types.ObjectId;
  date: Date;
  site?: Types.ObjectId;
  vendor: Types.ObjectId;
  items: PurchaseItem[];
  totalAmount: number;
  transportationFee?: number;
  billUpload?: BillUpload;
  addedBy: Types.ObjectId;
  status?: "pending" | "verified";
  payment: Payment;
  sourceOfFunds?: "company" | "siteManager";
  deductFromUserId?: Types.ObjectId;
  notes?: string;
  clientMutationId?: string;
  version?: number;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}