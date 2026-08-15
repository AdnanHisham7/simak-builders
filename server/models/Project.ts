import { Schema, model, Types } from "mongoose";

export interface ProjectGalleryImage {
  url: string;
  publicId?: string;
}

export interface Project {
  title: string;
  imagePath: string;
  imagePublicId: string;
  gallery: ProjectGalleryImage[];
  category: string;
  description: string;
  location: string;
  completionYear?: number;
  status: "ongoing" | "completed";
  progressPercentage: number;
  highlights: string[];
  clientTestimonial?: string;
  sourceSite?: Types.ObjectId;
  isPublished: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<Project>(
  {
    title: { type: String, required: true, trim: true },
    imagePath: { type: String, required: true },
    imagePublicId: { type: String, required: false },
    gallery: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
      },
    ],
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    completionYear: { type: Number },
    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "completed",
    },
    progressPercentage: { type: Number, min: 0, max: 100, default: 100 },
    highlights: [{ type: String, trim: true }],
    clientTestimonial: { type: String, trim: true },
    sourceSite: { type: Schema.Types.ObjectId, ref: "Site" },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ProjectSchema.index(
  { sourceSite: 1 },
  { unique: true, partialFilterExpression: { sourceSite: { $type: "objectId" } } }
);

export const ProjectModel = model<Project>("Project", ProjectSchema);
