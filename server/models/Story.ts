import { Schema, model } from "mongoose";
import { Story } from "@entities/story";

const StorySchema = new Schema<Story>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    caption: { type: String, trim: true, default: "" },
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    viewers: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    savedBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        savedAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

StorySchema.index({ expiresAt: 1 });
StorySchema.index({ site: 1, createdAt: -1 });
StorySchema.index({ user: 1, createdAt: -1 });
StorySchema.index({ "savedBy.user": 1 });
StorySchema.index({ "viewers.user": 1 });

export const StoryModel = model<Story>("Story", StorySchema);
