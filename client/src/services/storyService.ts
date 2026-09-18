import { privateClient } from "@/api";

export interface StoryViewerItem {
  user: {
    _id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  viewedAt: string;
}

export interface StoryReactionItem {
  user: {
    _id: string;
    name: string;
    role?: string;
    profileImage?: string;
  };
  emoji: string;
  createdAt: string;
}

export interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  site?: {
    _id: string;
    name: string;
  } | null;
  user?: {
    _id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  createdAt: string;
  expiresAt: string;
  hasViewed: boolean;
  isSaved: boolean;
  viewCount: number;
  viewers?: StoryViewerItem[];
  reactions?: StoryReactionItem[];
}

export interface StoryUserGroup {
  user: {
    _id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  stories: StoryItem[];
  hasUnseen: boolean;
  latestCreatedAt: string;
}

export interface ActiveStoriesResponse {
  groups: StoryUserGroup[];
  totalActiveStories: number;
}

export interface SiteMediaResponse {
  siteId: string;
  activeStories: StoryItem[];
  mediaArchive: StoryItem[];
  totalCount: number;
}

export interface WatchLaterResponse {
  stories: StoryItem[];
  count: number;
}

export type StoryGroup = StoryUserGroup;

export const getActiveStories = async (): Promise<StoryUserGroup[]> => {
  const response = await privateClient.get("/stories");
  return response.data?.groups || [];
};

export const createStory = async (formData: FormData): Promise<{ message: string; story: StoryItem }> => {
  const response = await privateClient.post("/stories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const markStoryViewed = async (storyId: string): Promise<{ message: string; viewCount: number }> => {
  const response = await privateClient.post(`/stories/${storyId}/view`);
  return response.data;
};

export const toggleSaveStory = async (storyId: string): Promise<{ isSaved: boolean; message: string }> => {
  const response = await privateClient.post(`/stories/${storyId}/save`);
  return response.data;
};

export const getWatchLaterStories = async (): Promise<StoryItem[]> => {
  const response = await privateClient.get("/stories/watch-later");
  return response.data?.stories || [];
};

export const getSiteMedia = async (siteId: string): Promise<SiteMediaResponse> => {
  const response = await privateClient.get(`/stories/site/${siteId}`);
  return response.data;
};

export const reactToStory = async (
  storyId: string,
  emoji: string
): Promise<{ message: string; reactions: StoryReactionItem[]; userReaction?: string | null }> => {
  const response = await privateClient.post(`/stories/${storyId}/react`, { emoji });
  return response.data;
};

export const deleteStory = async (storyId: string): Promise<{ message: string }> => {
  const response = await privateClient.delete(`/stories/${storyId}`);
  return response.data;
};

export const getStoryArchive = async (
  type: "my" | "general" = "my"
): Promise<{ stories: StoryItem[]; count: number }> => {
  const response = await privateClient.get(`/stories/archive?type=${type}`);
  return response.data || { stories: [], count: 0 };
};

