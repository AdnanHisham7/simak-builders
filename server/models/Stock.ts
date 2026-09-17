import { Schema, model } from "mongoose";
import { Stock } from "@entities/stock";

const StockSchema = new Schema<Stock>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    category: { type: String, required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    averagePrice: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    lastAlertSentAt: { type: Date },
  },
  { timestamps: true }
);

StockSchema.index({ site: 1, category: 1 });
StockSchema.index({ site: 1, quantity: 1 });

export const StockModel = model<Stock>("Stock", StockSchema);