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
      sourceOfFunds,
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

    const totalToDeduct = totalAmount + transportationFee;

    let deductingUser: any = null;
    let isCompanyDeduction = false;

    // ====================== BALANCE VALIDATION (includes transportation) ======================
    if (paymentMethod === "cash") {
      if (user.role === "admin") {
        if (!sourceOfFunds)
          throw new ApiError(
            "Source of funds is required",
            HttpStatus.BAD_REQUEST,
          );

        if (sourceOfFunds === "company") {
          isCompanyDeduction = true;
          const company = await CompanyModel.findOne();
          if (!company || company.totalAmount < totalToDeduct) {
            throw new ApiError(
              "Insufficient company funds",
              HttpStatus.BAD_REQUEST,
            );
          }
        } else if (sourceOfFunds === "siteManager") {
          if (!deductFromUserId)
            throw new ApiError(
              "Site manager ID required",
              HttpStatus.BAD_REQUEST,
            );
          deductingUser = await UserModel.findById(deductFromUserId);
          if (!deductingUser || deductingUser.role !== "siteManager") {
            throw new ApiError("Invalid site manager", HttpStatus.BAD_REQUEST);
          }
          if (deductingUser.siteExpensesBalance < totalToDeduct) {
            throw new ApiError(
              "Insufficient site manager funds",
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      } else if (user.role === "siteManager") {
        deductingUser = user;
        if (user.siteExpensesBalance < totalToDeduct) {
          throw new ApiError(
            "Insufficient site expenses balance",
            HttpStatus.BAD_REQUEST,
          );
        }
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
    });
    await purchase.save();

    // Create transportation as a separate pending miscellaneous expense (for verification flow)
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

    // ====================== DEDUCTION - TWO SEPARATE TRANSACTIONS ======================
    if (paymentMethod === "cash") {
      if (isCompanyDeduction) {
        const company = await CompanyModel.findOne();
        if (company) {
          company.totalAmount -= totalToDeduct;

          // 1. Purchase transaction
          company.transactions.push({
            date: new Date(),
            amount: -totalAmount,
            type: "expenditure",
            description: `Purchase${siteId ? ` for site ${site?.name || siteId}` : ""}`,
            site: siteId || null,
          });

          // 2. Transportation transaction (service)
          if (transportationFee > 0) {
            company.transactions.push({
              date: new Date(),
              amount: -transportationFee,
              type: "expenditure",
              description: "Transportation Fee (Service)",
              site: siteId || null,
            });
          }

          await company.save();
        }
      } else if (deductingUser) {
        // Deduct total from site manager balance
        deductingUser.siteExpensesBalance -= totalToDeduct;

        // 1. Purchase transaction
        const purchaseTrans: any = {
          date: new Date(),
          amount: -totalAmount,
          type: "expenditure",
          description: `Purchase for site ${site?.name || siteId || "company"}`,
          site: siteId || null,
          givenBy: user.role === "admin" ? user._id : undefined,
        };
        deductingUser.siteExpensesTransactions.push(purchaseTrans);

        // 2. Transportation transaction (service)
        if (transportationFee > 0) {
          const transTrans: any = {
            date: new Date(),
            amount: -transportationFee,
            type: "expenditure",
            description: "Transportation Fee (Service)",
            site: siteId || null,
            givenBy: user.role === "admin" ? user._id : undefined,
          };
          deductingUser.siteExpensesTransactions.push(transTrans);
        }

        await deductingUser.save();
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
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;
    const user = req.user;

    const purchase: any =
      await PurchaseModel.findById(purchaseId).populate("site");
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
      { status: "approved" },
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

    res
      .status(HttpStatus.OK)
      .json({ message: "Purchase verified and stocks updated" });
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
  getPurchasesBySite,
  getPurchasesBySiteForReport,
  deleteBillUpload,
};
