import { Types } from "mongoose";

export interface Site {
  _id: Types.ObjectId;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  client: Types.ObjectId;
  status: "InProgress" | "Completed";
  phases: Array<{
    _id?:string;
    name: string;
    status: "not started" | "pending" | "completed";
    completionDate?: Date;
    requestedBy?:string;
  }>;
  budget: number;
  expenses: number;
  transactions: Array<{
    date: Date;
    amount: number;
    type: "purchase" | "rental" | "attendance" | "stockTransfer" | "contractor_payment";
    description?: string;
    relatedId?: Types.ObjectId;
    user?: string;
  }>;
  documents: Array<{
    name: string;
    size: number;
    type: string;
    uploadDate: Date;
    url: string;
    uploadedBy: Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
