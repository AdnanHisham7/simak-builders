import { Request, Response, NextFunction } from "express";
import { PurchaseModel } from "@models/Purchase";
import { SiteModel } from "@models/Site";
import { StockModel } from "@models/Stock";
import { UserRole } from "@entities/user";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { CompanyModel } from "@models/Company";
import { UserModel } from "@models/User";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";
import * as fs from "fs/promises";
import * as path from "path";

const addPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, vendorId, paymentMethod } = req.body;
    const file = req.file;
    const user = await UserModel.findById(req.user?.userId);
    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    if (!paymentMethod || !["cash", "credit"].includes(paymentMethod)) {
      throw new ApiError("Invalid payment method", HttpStatus.BAD_REQUEST);
    }

    const totalAmount = parseFloat(req.body.totalAmount);
    if (isNaN(totalAmount) || !isFinite(totalAmount) || totalAmount <= 0) {
      throw new ApiError("Invalid total amount", HttpStatus.BAD_REQUEST);
    }

    const items =
      typeof req.body.items === "string"
        ? JSON.parse(req.body.items)
        : req.body.items;
    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      if (isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
        throw new ApiError(
          `Invalid quantity for item ${item.name}`,
          HttpStatus.BAD_REQUEST
        );
      }
      if (isNaN(price) || !isFinite(price) || price <= 0) {
        throw new ApiError(
          `Invalid price for item ${item.name}`,
          HttpStatus.BAD_REQUEST
        );
      }
      item.quantity = quantity;
      item.price = price;
    }

    let site;
    if (siteId) {
      site = await SiteModel.findById(siteId);
      if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    if (paymentMethod === "cash") {
      if (user.role === "siteManager") {
        if (user.siteExpensesBalance < totalAmount) {
          throw new ApiError(
            "Insufficient site expenses balance",
            HttpStatus.BAD_REQUEST
          );
        }
      } else if (user.role === "admin") {
        const company = await CompanyModel.findOne();
        if (!company)
          throw new ApiError(
            "Company not found",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        if (company.totalAmount < totalAmount) {
          throw new ApiError(
            "Insufficient company funds",
            HttpStatus.BAD_REQUEST
          );
        }
      } else {
        throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
      }
    }

    const billUpload = file
      ? {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadDate: new Date().toISOString(),
          url: `/uploads/${file.filename}`,
        }
      : null;

    const payment = {
      method: paymentMethod,
      isPaid: paymentMethod === "cash" ? true : false,
    };

    const purchase = new PurchaseModel({
      site: siteId || null,
      vendor: vendorId,
      items,
      totalAmount,
      billUpload,
      addedBy: req.user?.userId,
      payment,
    });
    await purchase.save();

    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "purchase_verification",
        relatedId: purchase._id,
        message: `New purchase of $${purchase.totalAmount} needs verification for site ${site?.name || purchase.site || "company"}`,
        status: "pending",
      });
      await notification.save();
    }

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "purchase",
      resourceId: purchase._id,
      details: `Added purchase for site: ${site?.name || purchase.site || "company"}`,
    });

    if (paymentMethod === "cash") {
      if (user.role === "siteManager") {
        const transaction:any = {
          date: new Date(),
          amount: -totalAmount,
          type: "expenditure",
          description: `Purchase for site ${site?.name || siteId || "company"}`,
          site: siteId || null,
        };
        user.siteExpensesTransactions.push(transaction);
        user.siteExpensesBalance -= totalAmount;
        await user.save();
      } else if (user.role === "admin") {
        const company = await CompanyModel.findOne();
        if (!company)
          throw new ApiError(
            "Company not found",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        company.totalAmount -= totalAmount;
        const transaction = {
          date: new Date(),
          amount: -totalAmount,
          type: "expenditure",
          description: `Purchase added${siteId ? ` for site ${site?.name || siteId}` : ""}`,
          site: siteId || null,
        };
        company.transactions.push(transaction);
        await company.save();
      }
    }

    res.status(HttpStatus.CREATED).json({
      message: "Purchase added",
      purchaseId: purchase._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { purchaseId } = req.params;
    const user = req.user;

    const purchase:any = await PurchaseModel.findById(purchaseId).populate("site");
    if (!purchase)
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);

    purchase.status = "verified";
    await purchase.save();

    for (const item of purchase.items) {
      const { name, unit, category, quantity } = item;
      const stockQuery = {
        name,
        unit,
        category,
        site: purchase.site ? purchase.site._id : null,
      };

      let stock = await StockModel.findOne(stockQuery);
      if (!stock) {
        stock = new StockModel({
          name,
          quantity: 0,
          unit,
          category,
          site: purchase.site ? purchase.site._id : null,
        });
      }
      stock.quantity += quantity;
      await stock.save();
    }

    await NotificationModel.updateMany(
      { relatedId: purchaseId, type: "purchase_verification" },
      { status: "approved" }
    );

    const notification = new NotificationModel({
      user: purchase.addedBy,
      type: "purchase_update",
      relatedId: purchase._id,
      message: `Your purchase of $${purchase.totalAmount} for site ${purchase.site?.name || "company"} has been verified`,
      status: "approved",
    });
    await notification.save();

    if (purchase.site) {
      const site = await SiteModel.findById(purchase.site?._id);
      const purchasedUser = await UserModel.findOne(purchase.addedBy);
      if (site) {
        site.expenses += purchase.totalAmount;
        site.transactions.push({
          date: new Date(),
          amount: purchase.totalAmount,
          type: "purchase",
          description: `Purchase added by ${purchasedUser?.name}`,
          relatedId: purchase._id,
          user: purchasedUser?._id.toString(),

        });
        await site.save();
      }
    }

    res.status(HttpStatus.OK).json({ message: "Purchase verified and stocks updated" });
  } catch (error) {
    next(error);
  }
};

const getPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    let filter: any = {};
    const purchases = await PurchaseModel.find(filter)
      .populate("site")
      .populate("vendor")
      .populate("addedBy");
    res.status(HttpStatus.OK).json(purchases);
  } catch (error) {
    next(error);
  }
};

const getPurchasesBySite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { siteId, status, startDate, endDate } = req.query;
    const filter: any = { site: siteId };
    if (status) filter.status = status;
    if (startDate) filter.createdAt = { $gte: new Date(startDate as string) };
    if (endDate)
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate as string) };

    const purchases = await PurchaseModel.find(filter)
      .populate("site")
      .populate("vendor")
      .populate("addedBy");

    res.status(HttpStatus.OK).json(purchases);
  } catch (error) {
    next(error);
  }
};

export const getPurchasesBySiteForReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const { status, clientId, minAmount, search, startDate, endDate } = req.query;
    const site = await SiteModel.findById(siteId);
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }
    const filter: any = { site: siteId };
    if (status) filter.status = status;
    if (clientId) {
      const clientSites = await SiteModel.find({ client: clientId }, { _id: 1 });
      const siteIds = clientSites.map((site) => site._id);
      filter.site = { $in: siteIds };
    }
    if (minAmount) filter.totalAmount = { $gte: parseFloat(minAmount as string) };
    if (search) filter["items.name"] = { $regex: search, $options: "i" };
    if (startDate) filter.createdAt = { $gte: new Date(startDate as string) };
    if (endDate)
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate as string) };
    const purchases = await PurchaseModel.find(filter)
      .populate("vendor", "name email phone")
      .populate("addedBy", "name email role");
    res.status(HttpStatus.OK).json(purchases);
  } catch (error) {
    next(error);
  }
};

const deleteBillUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { purchaseId } = req.params;
    const user = req.user;
    if (user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const purchase = await PurchaseModel.findById(purchaseId);
    if (!purchase) {
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);
    }
    if (!purchase.billUpload) {
      throw new ApiError("No bill upload found", HttpStatus.BAD_REQUEST);
    }
    const filename = purchase.billUpload?.url?.split("/").pop();
    const filePath = path.join(process.cwd(), "uploads", filename!);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
    await PurchaseModel.updateOne({ _id: purchaseId }, { $unset: { billUpload: "" } });
    res.status(HttpStatus.OK).json({ message: "Bill upload deleted" });
  } catch (error) {
    next(error);
  }
};

export default {
  getPurchases,
  addPurchase,
  verifyPurchase,
  getPurchasesBySite,
  getPurchasesBySiteForReport,
  deleteBillUpload,
};