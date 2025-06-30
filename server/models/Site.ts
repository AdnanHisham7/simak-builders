import { Schema, model } from "mongoose";
import { Site } from "@entities/site";

const SiteSchema = new Schema<Site>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["InProgress", "Completed"],
      default: "InProgress",
    },
    phases: [
      {
        name: { type: String, required: true },
        status: {
          type: String,
          enum: ["not started", "pending", "completed"],
          default: "not started",
        },
        requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
        completionDate: { type: Date },
      },
    ],
    budget: { type: Number, required: true },
    expenses: { type: Number, default: 0 },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        type: {
          type: String,
          enum: ["purchase", "rental", "attendance", "stockTransfer", "contractor_payment"],
          required: true,
        },
        description: { type: String },
        relatedId: { type: Schema.Types.ObjectId },
        user: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    documents: [
      {
        name: { type: String, required: true },
        size: { type: Number, required: true },
        type: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        url: { type: String, required: true },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        category: {
          type: String,
          enum: ["client", "site"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const SiteModel = model<Site>("Site", SiteSchema);
