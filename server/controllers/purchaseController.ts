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
import { Types } from "mongoose";
import { resolveItem } from "@utils/itemMaster";
import { computeWeightedAveragePrice } from "@utils/stockPricing";

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
      notes,
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
      if (!item.name || !String(item.name).trim())
        throw new ApiError("Item name is required", HttpStatus.BAD_REQUEST);
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

      const { canonicalName } = await resolveItem(
        item.name,
        item.category,
        item.unit,
        req.user?.userId,
      );
      item.name = canonicalName;
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
      notes: typeof notes === "string" ? notes.trim() : "",
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

    // Atomically flip status pending -> verified in a single findOneAndUpdate
    // so two near-simultaneous verify requests can't both observe "pending"
    // and both fall through to double-apply stock updates, site expenses,
    // and the source-of-funds deduction below.
    const purchase: any = await PurchaseModel.findOneAndUpdate(
      { _id: purchaseId, status: { $ne: "verified" } },
      { $set: { status: "verified" } },
      { new: true },
    ).populate("site");

    if (!purchase) {
      const stillExists = await PurchaseModel.exists({ _id: purchaseId });
      if (!stillExists) {
        throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);
      }
      throw new ApiError(
        "Purchase is already verified",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Defensively re-resolve every item name against the item master at the
    // moment stock is actually created. This protects against purchases
    // created before this feature existed, and against any future edit flow
    // on unverified purchases that might set a name without going through
    // resolveItem. Canonical names are backfilled onto the purchase itself.
    for (const item of purchase.items) {
      const { canonicalName } = await resolveItem(
        item.name,
        item.category,
        item.unit,
        purchase.addedBy?.toString(),
      );
      item.name = canonicalName;
    }
    purchase.markModified("items");
    await purchase.save();

    // Stock update
    for (const item of purchase.items) {
      const { name, unit, category, quantity, price } = item;
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
          averagePrice: 0,
        });
      }
      stock.averagePrice = computeWeightedAveragePrice(
        stock.quantity,
        stock.averagePrice || 0,
        quantity,
        price,
      );
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
    let updatedSiteExpenses: number | undefined;
    let newTransaction: any;
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
        updatedSiteExpenses = site.expenses;
        newTransaction = site.transactions[site.transactions.length - 1];
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

    res.status(HttpStatus.OK).json({
      message: "Purchase verified, stocks updated, funds deducted",
      purchase,
      site:
        updatedSiteExpenses !== undefined
          ? { _id: purchase.site?._id, expenses: updatedSiteExpenses }
          : undefined,
      transaction: newTransaction,
    });
  } catch (error) {
    next(error);
  }
};

const updatePurchaseItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId, itemIndex } = req.params;
    const { name, category } = req.body;

    const purchase: any = await PurchaseModel.findById(purchaseId);
    if (!purchase)
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);

    if (
      req.user?.role !== "admin" &&
      req.user?.userId !== purchase.addedBy.toString()
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const idx = parseInt(itemIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= purchase.items.length) {
      throw new ApiError("Invalid item index", HttpStatus.BAD_REQUEST);
    }

    if (!name || !String(name).trim())
      throw new ApiError("Item name is required", HttpStatus.BAD_REQUEST);
    if (!category || !String(category).trim())
      throw new ApiError("Category is required", HttpStatus.BAD_REQUEST);

    const item = purchase.items[idx];
    const oldName = item.name;
    const oldCategory = item.category;

    const { canonicalName } = await resolveItem(
      String(name).trim(),
      String(category).trim(),
      item.unit,
      req.user?.userId,
    );

    const wasVerified = purchase.status === "verified";

    // If already verified and name/category changed, adjust stocks dynamically
    if (wasVerified && (oldName !== canonicalName || oldCategory !== String(category).trim())) {
      // 1. Deduct quantity from old stock asset item
      const oldStock = await StockModel.findOne({
        name: oldName,
        category: oldCategory,
        unit: item.unit,
        site: purchase.site ? purchase.site : null,
      });
      if (oldStock) {
        oldStock.quantity -= item.quantity;
        if (oldStock.quantity < 0) oldStock.quantity = 0;
        await oldStock.save();
      }

      // 2. Add quantity to new stock asset item
      const stockQuery = {
        name: canonicalName,
        category: String(category).trim(),
        unit: item.unit,
        site: purchase.site ? purchase.site : null,
      };
      let newStock = await StockModel.findOne(stockQuery);
      if (!newStock) {
        newStock = new StockModel({
          ...stockQuery,
          quantity: 0,
          averagePrice: 0,
        });
      }
      newStock.averagePrice = computeWeightedAveragePrice(
        newStock.quantity,
        newStock.averagePrice || 0,
        item.quantity,
        item.price,
      );
      newStock.quantity += item.quantity;
      await newStock.save();
    }

    item.name = canonicalName;
    item.category = String(category).trim();
    purchase.markModified("items");
    await purchase.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "purchase",
      resourceId: purchase._id,
      details: `Edited item #${idx} on ${wasVerified ? "verified" : "unverified"} purchase (name/category)`,
    });

    res.status(HttpStatus.OK).json({
      message: "Item updated",
      item,
    });
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { purchaseId } = req.params;
    const purchase: any = await PurchaseModel.findById(purchaseId)
      .populate("site")
      .populate("vendor");

    if (!purchase)
      throw new ApiError("Purchase not found", HttpStatus.NOT_FOUND);

    // Authorization
    if (
      req.user?.role !== "admin" &&
      req.user?.userId !== purchase.addedBy.toString()
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const wasVerified = purchase.status === "verified";
    const purchaseAmount = purchase.totalAmount;
    const transportationFee = purchase.transportationFee || 0;

    let updatedSiteExpenses: number | undefined;
    if (wasVerified) {
      // 1. Reverse stock updates
      for (const item of purchase.items) {
        const stock = await StockModel.findOne({
          name: item.name,
          unit: item.unit,
          category: item.category,
          site: purchase.site?._id || null,
        });
        if (stock) {
          stock.quantity -= item.quantity;
          if (stock.quantity < 0) stock.quantity = 0;
          await stock.save();
        }
      }

      // 2. Reverse site expense
      const site = await SiteModel.findById(purchase.site?._id);
      if (site) {
        site.expenses -= purchaseAmount;
        site.transactions.push({
          date: new Date(),
          amount: -purchaseAmount,
          type: "purchase",
          description: `Reversal: Deleted purchase (Vendor: ${purchase.vendor?.name || "Unknown"})`,
          relatedId: new Types.ObjectId(purchase._id),
          user: new Types.ObjectId(req.user?.userId),
        });
        await site.save();
        updatedSiteExpenses = site.expenses;
      }

      // 3. Reverse source deduction (only for cash purchases)
      if (purchase.payment.method === "cash" && purchase.sourceOfFunds) {
        if (purchase.sourceOfFunds === "company") {
          const company = await CompanyModel.findOne();
          if (company) {
            company.totalAmount += purchaseAmount;
            company.transactions.push({
              date: new Date(),
              amount: purchaseAmount,
              type: "reversal",
              description: `Reversal: Deleted purchase for site ${purchase.site?.name || "company"}`,
              site: purchase.site?._id,
            });
            await company.save();
          }
        } else if (
          purchase.sourceOfFunds === "siteManager" &&
          purchase.deductFromUserId
        ) {
          const user = await UserModel.findById(purchase.deductFromUserId);
          if (user) {
            user.siteExpensesBalance += purchaseAmount;
            user.siteExpensesTransactions.push({
              date: new Date(),
              amount: purchaseAmount,
              type: "reversal",
              description: `Reversal: Deleted purchase for site ${purchase.site?.name || "company"}`,
              site: purchase.site?._id,
              givenBy: purchase.addedBy,
            });
            await user.save();
          }
        }
      }

      // 4. Delete linked miscellaneous expense (transportation) if it exists and is verified
      if (transportationFee > 0) {
        const miscExpense = await MiscellaneousExpenseModel.findOne({
          purchaseId: purchase._id,
          status: "verified",
        });
        if (miscExpense) {
          // Recursively call deleteMiscellaneousExpense logic or handle here
          // For simplicity, manually reverse and delete
          const totalMisc = miscExpense.amount + (miscExpense.tip || 0);
          const miscSite = await SiteModel.findById(miscExpense.site);
          if (miscSite) {
            miscSite.expenses -= totalMisc;
            miscSite.transactions.push({
              date: new Date(),
              amount: -totalMisc,
              type: "miscellaneous",
              description: `Reversal: Deleted transportation fee (linked to purchase)`,
              relatedId: new Types.ObjectId(miscExpense._id),
              user: new Types.ObjectId(req.user?.userId),
            });
            await miscSite.save();
            if (
              purchase.site?._id &&
              miscSite._id.toString() === purchase.site._id.toString()
            ) {
              updatedSiteExpenses = miscSite.expenses;
            }
          }
          // Reverse source for misc
          if (miscExpense.sourceOfFunds === "company") {
            const company = await CompanyModel.findOne();
            if (company) {
              company.totalAmount += totalMisc;
              company.transactions.push({
                date: new Date(),
                amount: totalMisc,
                type: "reversal",
                description: `Reversal: Deleted transportation fee for site ${miscSite?.name || ""}`,
                site: miscSite?._id,
              });
              await company.save();
            }
          } else if (
            miscExpense.sourceOfFunds === "siteManager" &&
            miscExpense.deductFromUserId
          ) {
            const user = await UserModel.findById(miscExpense.deductFromUserId);
            if (user) {
              user.siteExpensesBalance += totalMisc;
              user.siteExpensesTransactions.push({
                date: new Date(),
                amount: totalMisc,
                type: "reversal",
                description: `Reversal: Deleted transportation fee for site ${miscSite?.name || ""}`,
                site: miscSite?._id,
                givenBy: miscExpense.addedBy,
              });
              await user.save();
            }
          }
          await MiscellaneousExpenseModel.findByIdAndDelete(miscExpense._id);
        }
      }
    }

    // Delete bill from cloudinary if exists
    if (purchase.billUpload?.public_id) {
      const resourceType =
        purchase.billUpload.type === "application/pdf" ? "raw" : "image";
      await cloudinary.uploader.destroy(purchase.billUpload.public_id, {
        resource_type: resourceType,
      });
    }

    // Delete pending transportation misc if unverified
    if (!wasVerified && transportationFee > 0) {
      await MiscellaneousExpenseModel.deleteMany({
        purchaseId: purchase._id,
        status: "pending",
      });
    }

    await PurchaseModel.findByIdAndDelete(purchaseId);

    // Close out any notifications still pointing at this purchase so the
    // notification panel doesn't keep showing a "pending verification"
    // entry for a purchase that no longer exists.
    await NotificationModel.updateMany(
      {
        relatedId: purchase._id,
        type: "purchase_verification",
        status: "pending",
      },
      { status: "rejected" },
    );

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "purchase",
      resourceId: purchase._id,
      details: `Deleted ${wasVerified ? "verified" : "pending"} purchase`,
    });

    res.status(HttpStatus.OK).json({
      message: `Purchase deleted successfully${wasVerified ? " with accounting reversal" : ""}`,
      wasVerified,
      site:
        updatedSiteExpenses !== undefined
          ? { _id: purchase.site?._id, expenses: updatedSiteExpenses }
          : undefined,
    });
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
  updatePurchaseItem,
  deletePurchase,
  getPurchasesBySite,
  getPurchasesBySiteForReport,
  deleteBillUpload,
};