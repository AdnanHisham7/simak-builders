import { Schema, model } from "mongoose";
import { Item } from "@entities/item";

const ItemSchema = new Schema<Item>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    category: { type: String },
    defaultUnit: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ItemSchema.index({ normalizedName: 1 }, { unique: true });

export const ItemModel = model<Item>("Item", ItemSchema);