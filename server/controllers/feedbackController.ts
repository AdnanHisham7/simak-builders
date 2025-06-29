import { Request, Response, NextFunction } from "express";
import { FeedbackModel } from "@models/Feedback";
import { SiteModel } from "@models/Site";
import { UserRole } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, phase, comment, rating } = req.body;
    const user = req.user;

    if (user.role !== UserRole.Client) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const site = await SiteModel.findById(siteId);
    if (!site || !site.client.equals(user._id)) throw new ApiError("Site not found or unauthorized", HttpStatus.FORBIDDEN);

    const feedback = new FeedbackModel({
      site: siteId,
      phase,
      comment,
      rating,
      submittedBy: user._id,
    });
    await feedback.save();

    res.status(HttpStatus.CREATED).json({ message: "Feedback submitted", feedbackId: feedback._id });
  } catch (error) {
    next(error);
  }
};

const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const user = req.user;

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const canAccess =
      user.role === UserRole.CompanyAdmin ||
      user.role === UserRole.Supervisor ||
      site.siteManagers.includes(user._id) ||
      site.architects.includes(user._id) ||
      site.client.equals(user._id);

    if (!canAccess) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const feedback = await FeedbackModel.find({ site: siteId });
    res.status(HttpStatus.OK).json(feedback);
  } catch (error) {
    next(error);
  }
};

export default { submitFeedback, getFeedback };