import { Schema, model } from "mongoose";

// Contractor Schema
const ContractorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    company: { type: String },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    siteAssignments: [
      {
        site: { type: Schema.Types.ObjectId, ref: "Site" },
        balance: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const ContractorModel = model("Contractor", ContractorSchema);