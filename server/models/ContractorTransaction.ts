import { Schema, model, Types } from "mongoose";

const ContractorTransactionSchema = new Schema(
  {
    contractor: { type: Types.ObjectId, ref: "Contractor", required: true },
    site: { type: Types.ObjectId, ref: "Site", required: true },
    type: { 
      type: String, 
      enum: ["advance", "expense", "additional_payment"], 
      required: true 
    },
    amount: { type: Number, required: true },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    category: { type: String, default: "" }, // NEW: category type
    addedBy: { type: Types.ObjectId, ref: "User", required: true }, // Use addedBy consistently
  },
  { timestamps: true }
);

// Create index for faster queries
ContractorTransactionSchema.index({ contractor: 1, site: 1 });
ContractorTransactionSchema.index({ createdAt: -1 });

export const ContractorTransactionModel = model("ContractorTransaction", ContractorTransactionSchema);