import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g., "stock_transfer", "purchase_verification"
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    relatedId: { type: Schema.Types.ObjectId, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const NotificationModel = model("Notification", NotificationSchema);
