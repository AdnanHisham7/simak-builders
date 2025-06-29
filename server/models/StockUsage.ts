import { Schema, model } from "mongoose";
import { StockUsage } from "@entities/stockUsage";

const StockUsageSchema = new Schema<StockUsage>(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    stock: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
    quantity: { type: Number, required: true },
    usedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    usageDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StockUsageModel = model<StockUsage>("StockUsage", StockUsageSchema);