import { Schema, model } from "mongoose";

const MiscellaneousExpenseSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    category: {
      type: String,
      enum: ["machinery", "rental", "service"],
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
  },
  { timestamps: true },
);

export const MiscellaneousExpenseModel = model(
  "MiscellaneousExpense",
  MiscellaneousExpenseSchema
);