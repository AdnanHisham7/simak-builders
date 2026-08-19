import { Schema, model } from "mongoose";

const ClientTransactionSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    amount: { type: Number, required: true },
    notes: { type: String, default: "" },
    transactionDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const ClientTransactionModel = model(
  "ClientTransaction",
  ClientTransactionSchema,
);
