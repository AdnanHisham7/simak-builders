import { Types } from "mongoose";

export interface StoryViewer {
  user: Types.ObjectId;
  viewedAt: Date;
}

export interface StorySaved {
  user: Types.ObjectId;
  savedAt: Date;
}

export interface StoryReaction {
  user: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface Story {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  site?: Types.ObjectId;
  expiresAt: Date;
  viewers: StoryViewer[];
  savedBy: StorySaved[];
  reactions: StoryReaction[];
  createdAt?: Date;
  updatedAt?: Date;
}
