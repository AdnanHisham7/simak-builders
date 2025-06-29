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
  isAdmin?: boolean;
  enabledFunctionalities?: string[]; // For SiteManager, Supervisor customization
  googleId?: string;
  salaryAssignments: {
    date: Date;
    givenBy: Types.ObjectId;
    amount: number;
    isVerified: boolean;
  }[];
  totalSalary: number;
  fixedSalary: number;
  siteExpensesBalance: number;
  siteExpensesTransactions: {
    date: Date;
    amount: number;
    type: "incoming" | "expenditure";
    description?: string;
    site?: Types.ObjectId;
    givenBy?: Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
