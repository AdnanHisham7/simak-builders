import { Schema, model } from "mongoose";
import { Enquiry } from "@entities/enquiry";

const EnquirySchema = new Schema<Enquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isSeen: { type: Boolean, default: false }, // Added isSeen field
  },
  { timestamps: true }
);

export const EnquiryModel = model<Enquiry>("Enquiry", EnquirySchema);