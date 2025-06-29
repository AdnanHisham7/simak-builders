import { Schema, model } from "mongoose";
import { Purchase } from "@entities/purchase";

const PurchaseSchema = new Schema<Purchase>(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [
      {
        name: { type: String, required: true },
        unit: { type: String, required: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    billUpload: {
      name: { type: String, required: false },
      size: { type: Number, required: false },
      type: { type: String, required: false },
      uploadDate: { type: String, required: false },
      url: { type: String, required: false },
    },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    payment: {
      method: { type: String, enum: ["cash", "credit"], required: true },
      isPaid: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const PurchaseModel = model<Purchase>("Purchase", PurchaseSchema);