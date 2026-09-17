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
    supervisionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    transactions: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        type: {
          type: String,
          enum: ["purchase", "attendance", "stockTransfer", "contractor_payment", "miscellaneous"],
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
        public_id: { type: String, required: false },
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
        version: { type: Number, default: 1 },
        versions: [
          {
            version: { type: Number, required: true },
            name: { type: String, required: true },
            size: { type: Number, required: true },
            type: { type: String, required: true },
            url: { type: String, required: true },
            public_id: { type: String, required: false },
            uploadDate: { type: Date, default: Date.now },
            uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
            notes: { type: String, default: "" },
          },
        ],
        notes: { type: String, default: "" },
        status: {
          type: String,
          enum: ["draft", "pending_signature", "signed", "rejected"],
          default: "draft",
        },
        phaseId: { type: Schema.Types.ObjectId },
        phaseName: { type: String },
        signature: {
          signedBy: { type: Schema.Types.ObjectId, ref: "User" },
          signerName: { type: String },
          signerRole: { type: String },
          signatureDataUrl: { type: String },
          signedAt: { type: Date },
          comments: { type: String },
        },
        signRequests: [
          {
            requestedTo: { type: Schema.Types.ObjectId, ref: "User" },
            requestedRole: { type: String },
            requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
            requestedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ["pending", "signed", "rejected"], default: "pending" },
            message: { type: String },
          },
        ],
        rejectionReason: { type: String },
      },
    ],
    version: { type: Number, default: 1 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SiteSchema.index({ client: 1 });
SiteSchema.index({ status: 1 });
SiteSchema.index({ name: 1 });
SiteSchema.index({ createdAt: -1 });

export const SiteModel = model<Site>("Site", SiteSchema);