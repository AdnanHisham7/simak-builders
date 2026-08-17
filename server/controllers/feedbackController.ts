import { Request, Response, NextFunction } from "express";
import { FeedbackModel } from "@models/Feedback";
import { SiteModel } from "@models/Site";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";
import { ActivityLogModel } from "@models/ActivityLog";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const FEEDBACK_CATEGORIES = [
  "quality",
  "timeline",
  "communication",
  "budget",
  "safety",
  "other",
];

const FEEDBACK_STATUSES = ["open", "in_review", "resolved"];

const parsePagination = (query: Request["query"]) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};

const createFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "client") {
      throw new ApiError(
        "Only clients can submit feedback",
        HttpStatus.FORBIDDEN,
      );
    }

    const clientId = req.user.userId;
    const { siteId, rating, message, category } = req.body;

    if (!siteId) {
      throw new ApiError("Site is required", HttpStatus.BAD_REQUEST);
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new ApiError(
        "Rating must be a whole number between 1 and 5",
        HttpStatus.BAD_REQUEST,
      );
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage) {
      throw new ApiError(
        "Feedback message is required",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (trimmedMessage.length > 2000) {
      throw new ApiError(
        "Feedback message is too long",
        HttpStatus.BAD_REQUEST,
      );
    }

    const resolvedCategory = FEEDBACK_CATEGORIES.includes(category)
      ? category
      : "other";

    const site = await SiteModel.findOne({ _id: siteId, client: clientId });
    if (!site) {
      throw new ApiError(
        "Site not found or not authorized",
        HttpStatus.NOT_FOUND,
      );
    }

    const feedback = await FeedbackModel.create({
      client: clientId,
      site: siteId,
      category: resolvedCategory,
      rating: ratingNum,
      message: trimmedMessage,
    });

    const client = await UserModel.findById(clientId).select("name");
    const admins = await UserModel.find({ role: "admin" });
    await Promise.all(
      admins.map((admin) =>
        NotificationModel.create({
          user: admin._id,
          type: "client_feedback_submitted",
          relatedId: feedback._id,
          message: `${client?.name || "A client"} submitted feedback for site "${site.name}"`,
          status: "pending",
        }),
      ),
    );

    res.status(HttpStatus.CREATED).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "client") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { siteId, status } = req.query;
    const { page, limit } = parsePagination(req.query);

    const filter: Record<string, unknown> = { client: req.user.userId };
    if (siteId) filter.site = siteId;
    if (status && FEEDBACK_STATUSES.includes(String(status))) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      FeedbackModel.find(filter)
        .populate("site", "name")
        .populate("respondedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      FeedbackModel.countDocuments(filter),
    ]);

    res.status(HttpStatus.OK).json({ data, total, page, limit });
  } catch (error) {
    next(error);
  }
};

const getAllFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { siteId, status } = req.query;
    const { page, limit } = parsePagination(req.query);

    const filter: Record<string, unknown> = {};
    if (siteId) filter.site = siteId;
    if (status && FEEDBACK_STATUSES.includes(String(status))) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      FeedbackModel.find(filter)
        .populate("client", "name email")
        .populate("site", "name")
        .populate("respondedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      FeedbackModel.countDocuments(filter),
    ]);

    const openCount = await FeedbackModel.countDocuments({ status: "open" });

    res.status(HttpStatus.OK).json({ data, total, page, limit, openCount });
  } catch (error) {
    next(error);
  }
};

const respondToFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { feedbackId } = req.params;
    const { response, status } = req.body;
    const adminId = req.user.userId;

    if (!FEEDBACK_STATUSES.includes(status) || status === "open") {
      throw new ApiError(
        "Status must be either in_review or resolved",
        HttpStatus.BAD_REQUEST,
      );
    }

    const trimmedResponse =
      typeof response === "string" ? response.trim().slice(0, 2000) : "";

    if (status === "resolved" && !trimmedResponse) {
      throw new ApiError(
        "A response is required to mark feedback as resolved",
        HttpStatus.BAD_REQUEST,
      );
    }

    const feedback: any = await FeedbackModel.findById(feedbackId).populate(
      "site",
      "name",
    );
    if (!feedback) {
      throw new ApiError("Feedback not found", HttpStatus.NOT_FOUND);
    }

    feedback.status = status;
    if (trimmedResponse) {
      feedback.adminResponse = trimmedResponse;
      feedback.respondedBy = adminId;
      feedback.respondedAt = new Date();
    }
    await feedback.save();

    await NotificationModel.updateMany(
      { relatedId: feedback._id, type: "client_feedback_submitted" },
      { status: status === "resolved" ? "approved" : "pending" },
    );

    await NotificationModel.create({
      user: feedback.client,
      type: "client_feedback_responded",
      relatedId: feedback._id,
      message:
        status === "resolved"
          ? `Your feedback for site "${feedback.site?.name}" has been resolved`
          : `Your feedback for site "${feedback.site?.name}" is under review`,
      status: status === "resolved" ? "approved" : "pending",
    });

    await ActivityLogModel.create({
      user: adminId,
      action: "update",
      resource: "feedback",
      resourceId: feedback._id,
      details: `Marked feedback as ${status} for site ${feedback.site?.name}`,
    });

    res.status(HttpStatus.OK).json({
      message: "Feedback updated",
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

const getOpenFeedbackCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const count = await FeedbackModel.countDocuments({ status: "open" });
    res.status(HttpStatus.OK).json({ count });
  } catch (error) {
    next(error);
  }
};

export default {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  respondToFeedback,
  getOpenFeedbackCount,
};