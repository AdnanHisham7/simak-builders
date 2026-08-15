import { Types } from "mongoose";

export enum UserRole {
  CompanyAdmin = "admin",
  SiteManager = "siteManager",
  Supervisor = "supervisor",
  Architect = "architect",
  Client = "client",
  Employee = "employee",
}

export interface User {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  phone?: string;
  role: UserRole;
  assignedSites: Types.ObjectId[]; // For SiteManager, Architect, Client
  isEmailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  refreshToken?: string | null;
  twoFactorEnabled?: boolean; // For CompanyAdmin
  twoFactorSecret?: string;
  isKYCCompleted?: boolean; // For Client
  kycDocuments?: { type: string; url: string }[]; // For Client
  isBlocked?: boolean; // For SiteManager, Supervisor
  isDeleted?: boolean;
  deletedAt?: Date;
  isAdmin?: boolean;
  enabledFunctionalities?: string[]; // For SiteManager, Supervisor customization
  googleId?: string;
  salaryAssignments: {
    _id?: Types.ObjectId;
    date: Date;
    givenBy: Types.ObjectId;
    amount: number;
    allowance?: number;
    notes?: string;
    isVerified: boolean;
  }[];
  totalSalary: number;
  fixedSalary: number;
  siteExpensesBalance: number;
  siteExpensesTransactions: {
    date: Date;
    amount: number;
    type: "incoming" | "expenditure" | "reversal";
    description?: string;
    site?: Types.ObjectId;
    givenBy?: Types.ObjectId;
  }[];
  sessions: {
    _id: Types.ObjectId;
    tokenHash: string;
    userAgent?: string;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
    createdAt: Date;
    lastUsedAt: Date;
  }[];
  preferences: {
    defaultLandingPage?: string;
    dateFormat: string;
    numberFormat: string;
    timezone: string;
  };
  deactivationRequest?: {
    status: "none" | "pending" | "approved" | "rejected";
    reason?: string;
    requestedAt?: Date;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}