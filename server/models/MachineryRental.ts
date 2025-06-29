// models/MachineryRental.ts
import { Schema, model } from "mongoose";

const MachineryRentalSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" }, // null for company-level
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
  },
  { timestamps: true }
);

export const MachineryRentalModel = model("MachineryRental", MachineryRentalSchema);