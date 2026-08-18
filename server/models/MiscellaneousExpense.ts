import { Schema, model } from "mongoose";

const MiscellaneousExpenseSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    category: {
      type: String,
      enum: ["machinery", "rental", "service", "material"],
      required: true,
    },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    tip: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    date: { type: Date, required: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: "Purchase", required: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    sourceOfFunds: {
      type: String,
      enum: ["company", "siteManager"],
      required: false,
    },
    deductFromUserId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
    },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: false },
  },
  { timestamps: true },
);

MiscellaneousExpenseSchema.index({ site: 1, createdAt: -1 });

export const MiscellaneousExpenseModel = model(
  "MiscellaneousExpense",
  MiscellaneousExpenseSchema
);