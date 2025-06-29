import { Schema, model } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "create", "update"
    resource: { type: String, required: true }, // e.g., "user", "site", "stock"
    resourceId: { type: Schema.Types.ObjectId, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ActivityLogModel = model("ActivityLog", ActivityLogSchema);