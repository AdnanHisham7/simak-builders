import { Schema, model } from "mongoose";
import { User, UserRole } from "@entities/user";

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profileImage: { type: String },
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
    isAdmin: { type: Boolean, default: false },
    enabledFunctionalities: [{ type: String }],
    salaryAssignments: [
      {
        date: { type: Date, default: Date.now },
        givenBy: { type: Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number, required: true },
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
        type: { type: String, enum: ["incoming", "expenditure"], required: true },
        description: { type: String },
        site: { type: Schema.Types.ObjectId, ref: "Site" },
        givenBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = model<User>("User", UserSchema);