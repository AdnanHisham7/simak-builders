import { Schema, model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    category: {
      type: String,
      enum: ["quality", "timeline", "communication", "budget", "safety", "other"],
      default: "other",
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved"],
      default: "open",
    },
    adminResponse: { type: String, default: "", trim: true, maxlength: 2000 },
    respondedBy: { type: Schema.Types.ObjectId, ref: "User" },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

export const FeedbackModel = model("Feedback", FeedbackSchema);