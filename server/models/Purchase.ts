import { Schema, model } from "mongoose";
import { Purchase } from "@entities/purchase";

const PurchaseSchema = new Schema<Purchase>(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [
      {
        name: { type: String, required: true },
        unit: { type: String, required: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    transportationFee: { type: Number, default: 0 },
    billUpload: {
      name: { type: String, required: false },
      size: { type: Number, required: false },
      type: { type: String, required: false },
      uploadDate: { type: String, required: false },
      url: { type: String, required: false },
      public_id: { type: String, required: false },
    },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    payment: {
      method: { type: String, enum: ["cash", "credit"], required: true },
      isPaid: { type: Boolean, default: false },
      paidAmount: { type: Number, default: 0 },
    },
    sourceOfFunds: {
      type: String,
      enum: ["company", "siteManager"],
      required: false,
    },
    deductFromUserId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

PurchaseSchema.index({ site: 1, createdAt: -1 });
PurchaseSchema.index({ vendor: 1 });

export const PurchaseModel = model<Purchase>("Purchase", PurchaseSchema);