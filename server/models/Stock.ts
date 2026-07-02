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
  },
  { timestamps: true }
);

export const StockModel = model<Stock>("Stock", StockSchema);