import { Request, Response, NextFunction } from "express";
import { NotificationModel } from "@models/Notification";
import { StockModel } from "@models/Stock";
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
    })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich existing low stock notifications that are missing metadata (e.g. siteId, stockName)
    const stockAlertsNeedingEnrichment = notifications.filter(
      (n: any) =>
        (n.type === "low_stock_alert" || n.type === "stock_low_alert") &&
        (!n.metadata?.siteId || !n.metadata?.stockName) &&
        n.relatedId
    );

    if (stockAlertsNeedingEnrichment.length > 0) {
      const stockIds = stockAlertsNeedingEnrichment.map((n: any) => n.relatedId);
      const stocks = await StockModel.find({ _id: { $in: stockIds } })
        .populate("site", "name")
        .lean();
      const stockMap = new Map(stocks.map((s: any) => [String(s._id), s]));

      for (const notif of stockAlertsNeedingEnrichment as any[]) {
        const stock = stockMap.get(String(notif.relatedId));
        if (stock) {
          const siteObj = stock.site as any;
          const siteId = siteObj?._id
            ? String(siteObj._id)
            : stock.site
              ? String(stock.site)
              : undefined;
          const siteName = siteObj?.name || "";
          notif.metadata = {
            ...(notif.metadata || {}),
            stockId: String(stock._id),
            stockName: stock.name,
            siteId,
            siteName,
            category: stock.category,
            unit: stock.unit,
            quantity: stock.quantity,
            threshold: stock.lowStockThreshold,
          };

          NotificationModel.updateOne(
            { _id: notif._id },
            { $set: { metadata: notif.metadata } }
          )
            .exec()
            .catch(() => {});
        }
      }
    }

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
