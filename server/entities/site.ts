import { Types } from "mongoose";

export interface SiteDocumentVersion {
  version: number;
  name: string;
  size: number;
  type: string;
  url: string;
  public_id?: string;
  uploadDate: Date;
  uploadedBy?: Types.ObjectId;
  notes?: string;
}

export interface SiteDocumentSignature {
  signedBy?: Types.ObjectId;
  signerName: string;
  signerRole: string;
  signatureDataUrl?: string;
  signedAt: Date;
  comments?: string;
}

export interface SiteDocumentSignRequest {
  requestedTo?: Types.ObjectId;
  requestedRole: string;
  requestedBy?: Types.ObjectId;
  requestedAt: Date;
  status: "pending" | "signed" | "rejected";
}

export interface SiteDocument {
  _id?: Types.ObjectId;
  id?: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  url: string;
  public_id?: string;
  uploadedBy: Types.ObjectId;
  category: "client" | "site";
  version?: number;
  versions?: SiteDocumentVersion[];
  notes?: string;
  status?: "draft" | "pending_signature" | "signed" | "rejected";
  phaseId?: Types.ObjectId | string;
  phaseName?: string;
  signature?: SiteDocumentSignature;
  signRequests?: SiteDocumentSignRequest[];
  rejectionReason?: string;
}

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
    _id?: string;
    name: string;
    status: "not started" | "pending" | "completed";
    completionDate?: Date;
    requestedBy?: string;
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
  documents: Array<SiteDocument>;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  deletedAt?: Date | null;
}
