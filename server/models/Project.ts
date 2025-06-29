import { Schema, model } from "mongoose";

interface Project {
  title: string;
  imagePath: string;
  category: string;
  description: string;
}

const ProjectSchema = new Schema<Project>(
  {
    title: { type: String, required: true },
    imagePath: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const ProjectModel = model<Project>("Project", ProjectSchema);