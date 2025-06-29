import { Schema, model } from "mongoose";
import { StockTransfer } from "@entities/stockTransfer";

const StockTransferSchema = new Schema<StockTransfer>(
  {
    stock: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
    quantity: { type: Number, required: true },
    fromSite: { type: Schema.Types.ObjectId, ref: "Site" },
    toSite: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Requested", "Approved", "Rejected"], default: "Requested" },
  },
  { timestamps: true }
);

export const StockTransferModel = model<StockTransfer>("StockTransfer", StockTransferSchema);