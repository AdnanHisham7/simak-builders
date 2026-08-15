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
  supervisionPercentage: number;
  transactions: Array<{
    date: Date;
    amount: number;
    type: "purchase" | "attendance" | "stockTransfer" | "contractor_payment" | "miscellaneous";
    description?: string;
    relatedId?: Types.ObjectId;
    user?: Types.ObjectId;
  }>;
  documents: Array<{
    name: string;
    size: number;
    type: string;
    uploadDate: Date;
    url: string;
    public_id?: string;
    uploadedBy: Types.ObjectId;
    category: "client" | "site";
  }>;
  createdAt: Date;
  updatedAt: Date;
}
