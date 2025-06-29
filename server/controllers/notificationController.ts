import { Request, Response, NextFunction } from "express";
import { NotificationModel } from "@models/Notification";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const notifications = await NotificationModel.find({
      user: userId,
    }).sort({ createdAt: -1 });
    res.status(HttpStatus.OK).json(notifications);
  } catch (error) {
    next(error);
  }
};

const updateNotificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;
    const { status } = req.body;
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      throw new ApiError("Notification not found", HttpStatus.NOT_FOUND);
    }
    notification.status = status;
    await notification.save();
    res.status(HttpStatus.OK).json({ message: "Notification status updated" });
  } catch (error) {
    next(error);
  }
};

export default { getNotifications, updateNotificationStatus };
