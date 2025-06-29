import { Schema, model } from "mongoose";

const ContractorTransactionSchema = new Schema(
  {
    contractor: { type: Schema.Types.ObjectId, ref: "Contractor", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    type: {
      type: String,
      enum: ["advance", "expense", "additional_payment"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ContractorTransactionModel = model("ContractorTransaction", ContractorTransactionSchema);