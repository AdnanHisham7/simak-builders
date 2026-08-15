// models/Company.ts
import { Schema, model } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, default: "", trim: true },
    logo: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    zip: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    taxId: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    totalAmount: { type: Number, default: 0 },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true }, // Negative for expenditures
        type: {
          type: String,
          enum: ["expenditure", "incoming", "reversal"],
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
