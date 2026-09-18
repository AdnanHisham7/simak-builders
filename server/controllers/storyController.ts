import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { StoryModel } from "@models/Story";
import { SiteModel } from "@models/Site";
import { ActivityLogModel } from "@models/ActivityLog";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import path from "path";

const normalizeReaction = (emoji: string): string => {
  if (!emoji) return "";
  if (emoji === "❤️" || emoji === "heart") return "heart";
  if (emoji === "👍" || emoji === "like") return "like";
  if (emoji === "🔥" || emoji === "fire") return "fire";
  if (emoji === "👏" || emoji === "sparkles") return "sparkles";
  return emoji;
};

const deduplicateReactions = (reactions: any[]): any[] => {
  if (!Array.isArray(reactions)) return [];
  const map = new Map<string, any>();
  for (const r of reactions) {
    const rUserId = String((r.user as any)?._id || (r.user as any)?.id || r.user || "");
    if (rUserId) {
      map.set(rUserId, r);
    }
  }
  return Array.from(map.values());
};

const createStory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!req.file) {
      throw new ApiError("No media file uploaded", HttpStatus.BAD_REQUEST);
    }

    const { caption, siteId } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isVideo =
      req.file.mimetype.startsWith("video/") ||
      [".mp4", ".webm", ".mov", ".mkv"].includes(ext);

    const mediaType: "image" | "video" = isVideo ? "video" : "image";
    const mediaUrl = (req.file as any).path;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let resolvedSiteId: any = undefined;
    if (siteId && siteId !== "null" && siteId !== "undefined") {
      if (mongoose.Types.ObjectId.isValid(siteId)) {
        resolvedSiteId = siteId;
      } else {
        const cleanName = String(siteId).split("(")[0].trim();
        const foundSite = await SiteModel.findOne({
          $or: [
            { name: siteId },
            { name: cleanName },
            { name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i") } },
          ],
        });
        if (foundSite) {
          resolvedSiteId = foundSite._id;
        }
      }
    }

    const story = new StoryModel({
      user: userId,
      mediaUrl,
      mediaType,
      caption: caption ? String(caption).trim() : "",
      site: resolvedSiteId,
      expiresAt,
      viewers: [],
      savedBy: [],
      reactions: [],
    });

    await story.save();

    await story.populate([
      { path: "user", select: "name role profileImage" },
      { path: "site", select: "name" },
    ]);

    await ActivityLogModel.create({
      user: userId,
      action: "create",
      resource: "story",
      resourceId: story._id,
      details: `Uploaded 24h story update (${mediaType})`,
    });

    res.status(HttpStatus.CREATED).json({
      message: "Story published successfully",
      story,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveStories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.user?.userId ? String(req.user.userId) : "";
    const isAdmin = req.user?.role === "admin";

    // Active stories not expired yet
    const stories = await StoryModel.find({
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .populate("user", "name role profileImage")
      .populate("site", "name")
      .populate("viewers.user", "name role profileImage")
      .populate("reactions.user", "name role profileImage")
      .lean();

    // Group stories by uploader user
    const groupMap = new Map<string, any>();

    for (const story of stories) {
      if (!story.user) continue;
      const uploaderId = String((story.user as any)._id);

      if (!groupMap.has(uploaderId)) {
        groupMap.set(uploaderId, {
          user: story.user,
          stories: [],
          hasUnseen: false,
          latestCreatedAt: story.createdAt,
        });
      }

      const group = groupMap.get(uploaderId);

      const isMe = uploaderId === currentUserId;

      const hasViewed = story.viewers.some(
        (v: any) => String(v.user?._id || v.user) === currentUserId
      );

      const isSaved = story.savedBy.some(
        (s: any) => String(s.user?._id || s.user) === currentUserId
      );

      // If the current user hasn't viewed this story, group has unseen stories
      if (!hasViewed) {
        group.hasUnseen = true;
      }

      // Filter out story uploader from viewers (uploader's own view is not counted)
      const externalViewers = (story.viewers || []).filter(
        (v: any) => String(v.user?._id || v.user) !== uploaderId
      );

      // Seen by details and counts are only visible to the owner of the story
      const isOwner = isMe;

      group.stories.push({
        _id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        site: story.site,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        hasViewed,
        isSaved,
        viewCount: isOwner ? externalViewers.length : 0,
        viewers: isOwner ? externalViewers : [],
        reactions: deduplicateReactions(story.reactions || []),
      });

      group.latestCreatedAt = story.createdAt;
    }

    // Convert to array and sort:
    // 1. Current user's stories first (if any)
    // 2. Unseen groups
    // 3. Seen groups
    const groups = Array.from(groupMap.values()).sort((a, b) => {
      const aIsMe = String((a.user as any)._id) === currentUserId;
      const bIsMe = String((b.user as any)._id) === currentUserId;
      if (aIsMe && !bIsMe) return -1;
      if (!aIsMe && bIsMe) return 1;

      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;

      return (
        new Date(b.latestCreatedAt).getTime() -
        new Date(a.latestCreatedAt).getTime()
      );
    });

    res.status(HttpStatus.OK).json({
      groups,
      totalActiveStories: stories.length,
    });
  } catch (error) {
    next(error);
  }
};

const getSiteMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const currentUserId = req.user?.userId ? String(req.user.userId) : "";

    const allMedia = await StoryModel.find({ site: siteId })
      .sort({ createdAt: -1 })
      .populate("user", "name role profileImage")
      .populate("site", "name")
      .populate("viewers.user", "name role profileImage")
      .populate("reactions.user", "name role profileImage")
      .lean();

    const now = new Date();
    const activeStories: any[] = [];
    const mediaArchive: any[] = [];

    for (const item of allMedia) {
      const uploaderId = String((item.user as any)?._id || item.user);
      const isOwner = uploaderId === currentUserId;

      // Filter out uploader from viewers
      const externalViewers = (item.viewers || []).filter(
        (v: any) => String(v.user?._id || v.user) !== uploaderId
      );

      const enriched = {
        ...item,
        hasViewed: item.viewers.some(
          (v: any) => String(v.user?._id || v.user) === currentUserId
        ),
        isSaved: item.savedBy.some(
          (s: any) => String(s.user?._id || s.user) === currentUserId
        ),
        viewCount: isOwner ? externalViewers.length : 0,
        viewers: isOwner ? externalViewers : [],
        reactions: deduplicateReactions(item.reactions || []),
      };

      if (new Date(item.expiresAt) > now) {
        activeStories.push(enriched);
      }
      mediaArchive.push(enriched);
    }

    res.status(HttpStatus.OK).json({
      siteId,
      activeStories,
      mediaArchive,
      totalCount: allMedia.length,
    });
  } catch (error) {
    next(error);
  }
};

const markStoryViewed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.userId;

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new ApiError("Story not found", HttpStatus.NOT_FOUND);
    }

    const uploaderId = String(story.user);

    const alreadyViewed = story.viewers.some(
      (v: any) => String(v.user?._id || v.user) === String(userId)
    );

    if (!alreadyViewed) {
      story.viewers.push({
        user: userId as any,
        viewedAt: new Date(),
      });
      await story.save();
    }

    const externalViewers = (story.viewers || []).filter(
      (v: any) => String(v.user?._id || v.user) !== uploaderId
    );

    res.status(HttpStatus.OK).json({
      message: "Story viewed",
      viewCount: externalViewers.length,
    });
  } catch (error) {
    next(error);
  }
};

const toggleSaveStory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.userId;

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new ApiError("Story not found", HttpStatus.NOT_FOUND);
    }

    const existingIndex = story.savedBy.findIndex(
      (s) => String(s.user) === String(userId)
    );

    let isSaved = false;
    if (existingIndex > -1) {
      story.savedBy.splice(existingIndex, 1);
      isSaved = false;
    } else {
      story.savedBy.push({
        user: userId as any,
        savedAt: new Date(),
      });
      isSaved = true;
    }

    await story.save();

    res.status(HttpStatus.OK).json({
      isSaved,
      message: isSaved ? "Saved to Watch Later" : "Removed from Watch Later",
    });
  } catch (error) {
    next(error);
  }
};

const getWatchLaterStories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    const savedStories = await StoryModel.find({
      "savedBy.user": userId,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name role profileImage")
      .populate("site", "name")
      .lean();

    const currentUserId = String(userId);
    const enriched = savedStories.map((s) => {
      const uploaderId = String((s.user as any)?._id || s.user);
      const isOwner = uploaderId === currentUserId;
      const externalViewers = (s.viewers || []).filter(
        (v: any) => String(v.user?._id || v.user) !== uploaderId
      );

      return {
        ...s,
        hasViewed: s.viewers.some(
          (v: any) => String(v.user?._id || v.user) === currentUserId
        ),
        isSaved: true,
        viewCount: isOwner ? externalViewers.length : 0,
        viewers: isOwner ? externalViewers : [],
        reactions: deduplicateReactions(s.reactions || []),
      };
    });

    res.status(HttpStatus.OK).json({
      stories: enriched,
      count: enriched.length,
    });
  } catch (error) {
    next(error);
  }
};

const getStoryArchive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const currentUserId = String(userId);
    const type = (req.query.type as string) || "my"; // "my" | "general"

    if (type === "general" && userRole !== "admin") {
      throw new ApiError(
        "Access denied. Only administrators can view the general stories archive.",
        HttpStatus.FORBIDDEN
      );
    }

    let filter: any = {};
    if (type === "my") {
      filter = { user: userId };
    } else if (type === "general") {
      filter = {
        $or: [{ site: null }, { site: { $exists: false } }],
      };
    } else {
      filter = { user: userId };
    }

    const archivedStories = await StoryModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name role profileImage")
      .populate("site", "name")
      .populate("viewers.user", "name role profileImage")
      .populate("reactions.user", "name role profileImage")
      .lean();

    const enriched = archivedStories.map((s) => {
      const uploaderId = String((s.user as any)?._id || s.user);
      const isOwner = uploaderId === currentUserId;
      const externalViewers = (s.viewers || []).filter(
        (v: any) => String(v.user?._id || v.user) !== uploaderId
      );

      return {
        ...s,
        hasViewed: s.viewers.some(
          (v: any) => String(v.user?._id || v.user) === currentUserId
        ),
        isSaved: s.savedBy.some(
          (sb: any) => String(sb.user?._id || sb.user) === currentUserId
        ),
        viewCount: isOwner ? externalViewers.length : 0,
        viewers: isOwner ? externalViewers : [],
        reactions: deduplicateReactions(s.reactions || []),
      };
    });

    res.status(HttpStatus.OK).json({
      type,
      stories: enriched,
      count: enriched.length,
    });
  } catch (error) {
    next(error);
  }
};

const reactToStory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storyId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.userId;

    if (!emoji) {
      throw new ApiError("Emoji is required", HttpStatus.BAD_REQUEST);
    }

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new ApiError("Story not found", HttpStatus.NOT_FOUND);
    }

    if (String(story.user) === String(userId)) {
      throw new ApiError("Cannot react to your own story", HttpStatus.BAD_REQUEST);
    }

    const getUserIdStr = (u: any) => {
      if (!u) return "";
      if (typeof u === "string") return u;
      return String(u._id || u.id || u);
    };

    const targetEmoji = normalizeReaction(String(emoji));

    // Check if user already had a reaction
    const existing = (story.reactions || []).find(
      (r: any) => getUserIdStr(r.user) === String(userId)
    );
    const existingEmoji = existing ? normalizeReaction(existing.emoji) : null;

    // Prune ALL previous reactions by this user so duplicates never accumulate
    story.reactions = (story.reactions || []).filter(
      (r: any) => getUserIdStr(r.user) !== String(userId)
    ) as any;

    let isRemoved = false;
    if (existingEmoji === targetEmoji) {
      // Same reaction clicked again -> toggle off (removed)
      isRemoved = true;
    } else {
      // New or switched reaction -> exactly 1 reaction added
      story.reactions.push({
        user: userId as any,
        emoji: targetEmoji,
        createdAt: new Date(),
      });
    }

    await story.save();
    await story.populate("reactions.user", "name role profileImage");

    const finalReactions = deduplicateReactions(story.reactions);

    res.status(HttpStatus.OK).json({
      message: isRemoved ? "Reaction removed" : "Reaction recorded",
      reactions: finalReactions,
      userReaction: isRemoved ? null : targetEmoji,
    });
  } catch (error) {
    next(error);
  }
};

const deleteStory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storyId } = req.params;
    const userId = String(req.user?.userId);
    const isAdmin = req.user?.role === "admin";

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw new ApiError("Story not found", HttpStatus.NOT_FOUND);
    }

    if (String(story.user) !== userId && !isAdmin) {
      throw new ApiError("Unauthorized to delete this story", HttpStatus.FORBIDDEN);
    }

    await StoryModel.findByIdAndDelete(storyId);

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "story",
      resourceId: storyId,
      details: "Deleted story",
    });

    res.status(HttpStatus.OK).json({ message: "Story deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export default {
  createStory,
  getActiveStories,
  getSiteMedia,
  markStoryViewed,
  toggleSaveStory,
  getWatchLaterStories,
  getStoryArchive,
  reactToStory,
  deleteStory,
};
