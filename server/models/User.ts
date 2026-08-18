import { Schema, model } from "mongoose";
import { User, UserRole } from "@entities/user";

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    assignedSites: [{ type: Schema.Types.ObjectId, ref: "Site" }],
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetToken: { type: String },
    refreshToken: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    isKYCCompleted: { type: Boolean, default: false },
    kycDocuments: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isAdmin: { type: Boolean, default: false },
    enabledFunctionalities: [{ type: String }],
    salaryAssignments: [
      {
        date: { type: Date, default: Date.now },
        givenBy: { type: Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number, required: true },
        allowance: { type: Number, default: 0 },
        notes: { type: String, default: "", trim: true },
        isVerified: { type: Boolean, default: false },
      },
    ],
    totalSalary: { type: Number, default: 0 },
    fixedSalary: { type: Number, default: 0 },
    siteExpensesBalance: { type: Number, default: 0 },
    siteExpensesTransactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        type: { type: String, enum: ["incoming", "expenditure", "reversal"], required: true },
        description: { type: String },
        site: { type: Schema.Types.ObjectId, ref: "Site" },
        givenBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    sessions: [
      {
        tokenHash: { type: String, required: true, select: false },
        userAgent: { type: String },
        ip: { type: String },
        device: { type: String },
        browser: { type: String },
        os: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
      },
    ],
    preferences: {
      defaultLandingPage: { type: String, default: "" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      numberFormat: { type: String, default: "en-IN" },
      timezone: { type: String, default: "Asia/Kolkata" },
    },
    deactivationRequest: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      reason: { type: String },
      requestedAt: { type: Date },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      reviewNotes: { type: String },
    },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ assignedSites: 1 });
UserSchema.index({ role: 1, isDeleted: 1 });

export const UserModel = model<User>("User", UserSchema);