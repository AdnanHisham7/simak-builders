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
import cloudinary from "../services/cloudinaryService";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";

const addPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      siteId,
      vendorId,
      paymentMethod,
      sourceOfFunds: reqSource,
      deductFromUserId,
      date: dateStr,
      transportationFee: transFeeStr,
    } = req.body;

    const file = req.file;
    const user = await UserModel.findById(req.user?.userId);
    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    if (!paymentMethod || !["cash", "credit"].includes(paymentMethod)) {
      throw new ApiError("Invalid payment method", HttpStatus.BAD_REQUEST);
    }

    const totalAmount = parseFloat(req.body.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new ApiError("Invalid total amount", HttpStatus.BAD_REQUEST);
    }

    const transportationFee = parseFloat(transFeeStr || "0");
    if (isNaN(transportationFee) || transportationFee < 0) {
      throw new ApiError("Invalid transportation fee", HttpStatus.BAD_REQUEST);
    }

    // Determine funding source WITHOUT any balance check (deduction moved to verify)
    let sourceOfFunds: string | undefined;
    let deductUserId: string | undefined;

    if (paymentMethod === "cash") {
      if (user.role === "admin") {
        if (!reqSource)
          throw new ApiError(
            "Source of funds is required",
            HttpStatus.BAD_REQUEST,
          );
        sourceOfFunds = reqSource;
        if (sourceOfFunds === "siteManager") {
          if (!deductFromUserId)
            throw new ApiError(
              "Site manager ID required",
              HttpStatus.BAD_REQUEST,
            );
          deductUserId = deductFromUserId;
        } else if (sourceOfFunds !== "company") {
          throw new ApiError("Invalid source of funds", HttpStatus.BAD_REQUEST);
        }
      } else if (user.role === "siteManager") {
        sourceOfFunds = "siteManager";
        deductUserId = req.user?.userId;
      } else {
        throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
      }
    }

    let purchaseDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) purchaseDate = parsed;
    }

    let items =
      typeof req.body.items === "string"
        ? JSON.parse(req.body.items)
        : req.body.items;
    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      const itemTotal = parseFloat(item.totalAmount || "0");
      if (isNaN(quantity) || quantity <= 0)
        throw new ApiError(
          `Invalid quantity for item ${item.name}`,
          HttpStatus.BAD_REQUEST,
        );
      if (isNaN(price) || price <= 0)
        throw new ApiError(
          `Invalid unit price for item ${item.name}`,
          HttpStatus.BAD_REQUEST,
        );
      if (isNaN(itemTotal) || itemTotal <= 0)
        throw new ApiError(
          `Invalid total amount for item ${item.name}`,
          HttpStatus.BAD_REQUEST,
        );
      item.quantity = quantity;
      item.price = price;
      item.totalAmount = itemTotal;
    }

    let site;
    if (siteId) {
      site = await SiteModel.findById(siteId);
      if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    const billUpload = file
      ? {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadDate: new Date().toISOString(),
          url: file.path,
          public_id: (file as any).filename || (file as any).path,
        }
      : null;

    const payment = {
      method: paymentMethod,
      isPaid: paymentMethod === "cash",
    };

    const purchase = new PurchaseModel({
      date: purchaseDate,
      site: siteId || null,
      vendor: vendorId,
      items,
      totalAmount,
      transportationFee,
      billUpload,
      addedBy: req.user?.userId,
      payment,
      sourceOfFunds, // ← saved
      deductFromUserId: deductUserId, // ← saved
    });

    await purchase.save();

    // Transportation as separate pending miscellaneous
    if (transportationFee > 0 && siteId) {
      const misc = new MiscellaneousExpenseModel({
        site: siteId,
        category: "service",
        name: "Transportation Fee",
        amount: transportationFee,
        tip: 0,
        notes: `from purchase`,
        purchaseId: purchase._id,
        date: purchaseDate,
        addedBy: req.user?.userId,
        status: "pending",
        sourceOfFunds,
        deductFromUserId: deductUserId,
      });
      await misc.save();
    }

    // Notifications & Activity Log
    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "purchase_verification",
        relatedId: purchase._id,
        message: `New purchase of ₹${purchase.totalAmount} (incl. transportation ₹${transportationFee}) needs verification for site ${site?.name || "company"}`,
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

    // NO DEDUCTION / NO TRANSACTIONS HERE ANYMORE (moved to verifyPurchase)

    res.status(HttpStatus.CREATED).json({
      message: "Purchase added (pending verification)",
      purchaseId: purchase._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;
    const purchase: any =
      await PurchaseModel.findById(purchaseId).populate("site");
    if (!purchase)
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);

    purchase.status = "verified";
    await purchase.save();

    // Stock update
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

    // Notifications
    await NotificationModel.updateMany(
      { relatedId: purchaseId, type: "purchase_verification" },
      { status: "approved" },
    );
    const notification = new NotificationModel({
      user: purchase.addedBy,
      type: "purchase_update",
      relatedId: purchase._id,
      message: `Your purchase of ₹${purchase.totalAmount} for site ${purchase.site?.name || "company"} has been verified`,
      status: "approved",
    });
    await notification.save();

    // Site expense record
    if (purchase.site) {
      const site = await SiteModel.findById(purchase.site?._id);
      const purchasedUser = await UserModel.findById(purchase.addedBy);
      if (site) {
        site.expenses += purchase.totalAmount;
        site.transactions.push({
          date: new Date(),
          amount: purchase.totalAmount,
          type: "purchase",
          description: `Purchase added by ${purchasedUser?.name}`,
          relatedId: purchase._id,
          user: purchasedUser?._id,
        });
        await site.save();
      }
    }

    // DEDUCTION ON VERIFICATION
    if (purchase.payment.method === "cash" && purchase.sourceOfFunds) {
      const purchaseOnlyAmount = purchase.totalAmount;

      if (purchase.sourceOfFunds === "company") {
        const company = await CompanyModel.findOne();
        if (company) {
          company.totalAmount -= purchaseOnlyAmount;
          company.transactions.push({
            date: new Date(),
            amount: -purchaseOnlyAmount,
            type: "expenditure",
            description: `Purchase${purchase.site ? ` for site ${purchase.site.name || purchase.site}` : ""}`,
            site: purchase.site?._id || null,
          });
          await company.save();
        }
      } else if (
        purchase.sourceOfFunds === "siteManager" &&
        purchase.deductFromUserId
      ) {
        const deductingUser = await UserModel.findById(
          purchase.deductFromUserId,
        );
        if (deductingUser) {
          deductingUser.siteExpensesBalance -= purchaseOnlyAmount;
          deductingUser.siteExpensesTransactions.push({
            date: new Date(),
            amount: -purchaseOnlyAmount,
            type: "expenditure",
            description: `Purchase for site ${purchase.site?.name || "company"}`,
            site: purchase.site?._id || null,
            givenBy: purchase.addedBy,
          });
          await deductingUser.save();
        }
      }
    }

    res
      .status(HttpStatus.OK)
      .json({ message: "Purchase verified, stocks updated, funds deducted" });
  } catch (error) {
    next(error);
  }
};

// Delete only unverified purchases (no refund needed because deduction never happened)
const deletePurchase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;

    const purchase: any = await PurchaseModel.findById(purchaseId);
    if (!purchase)
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);

    if (purchase.status === "verified") {
      throw new ApiError(
        "Cannot delete a verified purchase. Deductions and records are permanent.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Authorization: admin or the person who added it
    if (
      req.user?.role !== "admin" &&
      req.user?.userId !== purchase.addedBy.toString()
    ) {
      throw new ApiError(
        "Unauthorized to delete this purchase",
        HttpStatus.FORBIDDEN,
      );
    }

    // Clean up bill from Cloudinary if exists
    if (purchase.billUpload?.public_id) {
      const resourceType =
        purchase.billUpload.type === "application/pdf" ? "raw" : "image";
      await cloudinary.uploader.destroy(purchase.billUpload.public_id, {
        resource_type: resourceType,
      });
    }

    // Delete linked pending transportation miscellaneous
    if (purchase.transportationFee > 0) {
      await MiscellaneousExpenseModel.deleteMany({
        purchaseId: purchase._id,
        status: "pending",
      });
    }

    await PurchaseModel.findByIdAndDelete(purchaseId);

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "purchase",
      resourceId: purchase._id,
      details: `Deleted pending purchase`,
    });

    res
      .status(HttpStatus.OK)
      .json({ message: "Purchase deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
) => {
  try {
    const user = req.user;
    const { siteId, status, startDate, endDate } = req.query;
    const filter: any = { site: siteId };
    if (status) filter.status = status;
    if (startDate) filter.createdAt = { $gte: new Date(startDate as string) };
    if (endDate)
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(endDate as string),
      };

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
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const { status, clientId, minAmount, search, startDate, endDate } =
      req.query;
    const site = await SiteModel.findById(siteId);
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }
    const filter: any = { site: siteId };
    if (status) filter.status = status;
    if (clientId) {
      const clientSites = await SiteModel.find(
        { client: clientId },
        { _id: 1 },
      );
      const siteIds = clientSites.map((site) => site._id);
      filter.site = { $in: siteIds };
    }
    if (minAmount)
      filter.totalAmount = { $gte: parseFloat(minAmount as string) };
    if (search) filter["items.name"] = { $regex: search, $options: "i" };
    if (startDate) filter.createdAt = { $gte: new Date(startDate as string) };
    if (endDate)
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(endDate as string),
      };
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
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;

    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const purchase: any = await PurchaseModel.findById(purchaseId);
    if (!purchase) {
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);
    }

    if (!purchase.billUpload) {
      throw new ApiError("No bill upload found", HttpStatus.BAD_REQUEST);
    }

    // ✅ DELETE FROM CLOUDINARY
    const resourceType =
      purchase.billUpload.type === "application/pdf" ? "raw" : "image";

    await cloudinary.uploader.destroy(purchase.billUpload.public_id, {
      resource_type: resourceType,
    });

    // ✅ REMOVE FROM DB
    await PurchaseModel.updateOne(
      { _id: purchaseId },
      { $unset: { billUpload: "" } },
    );

    res.status(HttpStatus.OK).json({ message: "Bill upload deleted" });
  } catch (error) {
    next(error);
  }
};

export default {
  getPurchases,
  addPurchase,
  verifyPurchase,
  deletePurchase,
  getPurchasesBySite,
  getPurchasesBySiteForReport,
  deleteBillUpload,
};
