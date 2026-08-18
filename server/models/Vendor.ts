import { Schema, model } from "mongoose";
import { Vendor } from "@entities/vendor";

const VendorSchema = new Schema<Vendor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

VendorSchema.index({ name: 1 });

export const VendorModel = model<Vendor>("Vendor", VendorSchema);
