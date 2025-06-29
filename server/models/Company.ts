// models/Company.ts
import { Schema, model } from "mongoose";

const CompanySchema = new Schema(
  {
    totalAmount: { type: Number, default: 0 },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true }, // Negative for expenditures
        type: {
          type: String,
          enum: ["expenditure", "incoming"],
          required: true,
        },
        description: { type: String },
        site: {
          type: Schema.Types.ObjectId,
          ref: "Site",
        }, // Optional, if tied to a specific site
      },
    ],
    // Additional fields like name, address can be added if needed
  },
  { timestamps: true }
);

export const CompanyModel = model("Company", CompanySchema);
