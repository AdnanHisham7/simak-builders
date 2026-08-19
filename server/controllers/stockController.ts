import { Request, Response, NextFunction } from "express";
import { StockModel } from "@models/Stock";
import { StockTransferModel } from "@models/StockTransfer";
import { StockUsageModel } from "@models/StockUsage";
import { SiteModel } from "@models/Site";
import { UserRole } from "@entities/user";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ActivityLogModel } from "@models/ActivityLog";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";
import { Types } from "mongoose";
import { resolveItem } from "@utils/itemMaster";
import { computeWeightedAveragePrice } from "@utils/stockPricing";
import {
  cacheGet,
  cacheSet,
  bumpCacheVersion,
  getCacheVersion,
} from "@config/redis";

const STOCKS_CACHE_NAMESPACE = "stocks";
const STOCKS_CACHE_TTL_SECONDS = 20;

const addStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, quantity, unit, category, siteId, price } = req.body;
    const user = req.user;

    if (!name || !String(name).trim())
      throw new ApiError("Item name is required", HttpStatus.BAD_REQUEST);

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0)
      throw new ApiError("Invalid quantity", HttpStatus.BAD_REQUEST);

    const parsedPrice =
      price !== undefined && price !== null && price !== ""
        ? parseFloat(price)
        : null;
    if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0))
      throw new ApiError("Invalid unit price", HttpStatus.BAD_REQUEST);

    const { canonicalName } = await resolveItem(
      name,
      category,
      unit,
      user?.userId,
    );

    let stock = await StockModel.findOne({
      name: canonicalName,
      unit,
      category,
      site: siteId || null,
    });

    if (stock) {
      if (parsedPrice !== null) {
        stock.averagePrice = computeWeightedAveragePrice(
          stock.quantity,
          stock.averagePrice || 0,
          parsedQuantity,
          parsedPrice,
        );
      }
      stock.quantity += parsedQuantity;
      await stock.save();
    } else {
      stock = new StockModel({
        name: canonicalName,
        quantity: parsedQuantity,
        unit,
        category,
        site: siteId || null,
        averagePrice: parsedPrice !== null ? parsedPrice : 0,
      });
      await stock.save();
    }

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "stock",
      resourceId: stock._id,
      details: `Added stock: ${stock.name}`,
    });

    await bumpCacheVersion(STOCKS_CACHE_NAMESPACE);

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Stock added", stockId: stock._id });
  } catch (error) {
    next(error);
  }
};

const requestStockTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { stockId, quantity, toSiteId, fromSiteId } = req.body;
    const user = req.user;

    const stock = await StockModel.findById(stockId);
    if (!stock || stock.quantity < quantity)
      throw new ApiError("Insufficient stock", HttpStatus.BAD_REQUEST);

    let transfer: any = new StockTransferModel({
      stock: stockId,
      quantity,
      fromSite: fromSiteId || null,
      toSite: toSiteId,
      requestedBy: user?.userId,
    });
    await transfer.save();

    // ✅ Re-assign with populated version
    transfer = await StockTransferModel.findById(transfer._id)
      .populate({ path: "fromSite", select: "name" })
      .populate({ path: "toSite", select: "name" });

    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "stock_transfer",
        relatedId: transfer._id,
        message: `New stock transfer request from site ${
          transfer.fromSite?.name || "company"
        } to site ${transfer.toSite?.name}`,
        status: "pending",
      });

      await notification.save();
    }

    res.status(HttpStatus.CREATED).json({
      message: "Stock transfer requested",
      transferId: transfer._id,
    });
  } catch (error) {
    next(error);
  }
};

const approveStockTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId } = req.params;
    const user = req.user;

    const transfer = await StockTransferModel.findById(transferId).populate(
      "stock"
    );
    if (!transfer)
      throw new ApiError("Transfer not found", HttpStatus.NOT_FOUND);

    let fromStock;
    if (transfer.fromSite) {
      fromStock = await StockModel.findOne({
        _id: transfer.stock,
        site: transfer.fromSite,
      });
    } else {
      fromStock = await StockModel.findOne({ _id: transfer.stock, site: null });
    }
    if (!fromStock || fromStock.quantity < transfer.quantity) {
      throw new ApiError("Insufficient stock", HttpStatus.BAD_REQUEST);
    }

    const stockValue = (fromStock.averagePrice || 0) * transfer.quantity;

    if (transfer.fromSite) {
      const sourceSite = await SiteModel.findById(transfer.fromSite);
      if (sourceSite) {
        sourceSite.expenses -= stockValue;
        sourceSite.transactions.push({
          date: new Date(),
          amount: -stockValue,
          type: "stockTransfer",
          description: `Stock (${fromStock.name}) transferred to site ${transfer.toSite}`,
          relatedId: new Types.ObjectId(transfer._id),
          user: new Types.ObjectId(user?.userId),
        });
        await sourceSite.save();
      }
    }

    fromStock.quantity -= transfer.quantity;
    await fromStock.save();

    const toStockQuery = {
      name: fromStock.name,
      unit: fromStock.unit,
      category: fromStock.category,
      site: transfer.toSite,
    };
    let toStock = await StockModel.findOne(toStockQuery);
    if (!toStock) {
      toStock = new StockModel({ ...toStockQuery, quantity: 0, averagePrice: 0 });
    }
    toStock.averagePrice = computeWeightedAveragePrice(
      toStock.quantity,
      toStock.averagePrice || 0,
      transfer.quantity,
      fromStock.averagePrice || 0,
    );
    toStock.quantity += transfer.quantity;
    await toStock.save();

    const destinationSite = await SiteModel.findById(transfer.toSite);
    if (destinationSite) {
      destinationSite.expenses += stockValue;
      destinationSite.transactions.push({
        date: new Date(),
        amount: stockValue,
        type: "stockTransfer",
        description: `Stock (${fromStock.name}) received from ${
          transfer.fromSite ? "site " + transfer.fromSite : "company stock"
        }`,
        relatedId: new Types.ObjectId(transfer._id),
        user: new Types.ObjectId(user?.userId),
      });
      await destinationSite.save();
    }

    transfer.status = "Approved";
    transfer.approvedBy = user?.userId;
    await transfer.save();

    await NotificationModel.updateMany(
      { relatedId: transferId, type: "stock_transfer" },
      { status: "approved" }
    );

    const notification = new NotificationModel({
      user: transfer.requestedBy,
      type: "stock_transfer_update",
      relatedId: transfer._id,
      message: `Your stock transfer request from ${
        transfer.fromSite || "company"
      } to site ${transfer.toSite} has been approved`,
      status: "approved",
    });
    await notification.save();

    await bumpCacheVersion(STOCKS_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Stock transfer approved" });
  } catch (error) {
    next(error);
  }
};

const rejectStockTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId } = req.params;
    const user = req.user;

    const transfer: any = await StockTransferModel.findById(transferId)
      .populate("fromSite")
      .populate("toSite");
    if (!transfer) {
      throw new ApiError("Transfer not found", HttpStatus.NOT_FOUND);
    }

    if (transfer.status !== "Requested") {
      throw new ApiError("Transfer cannot be rejected", HttpStatus.BAD_REQUEST);
    }

    transfer.status = "Rejected";
    transfer.rejectedBy = user?.userId;
    await transfer.save();

    await NotificationModel.updateMany(
      { relatedId: transferId, type: "stock_transfer" },
      { status: "rejected" }
    );

    const notification = new NotificationModel({
      user: transfer.requestedBy,
      type: "stock_transfer_update",
      relatedId: transfer._id,
      message: `Your stock transfer request from ${
        transfer.fromSite ? transfer.fromSite.name : "company"
      } to ${transfer.toSite.name} has been rejected`,
      status: "rejected",
    });
    await notification.save();

    res.status(HttpStatus.OK).json({ message: "Stock transfer rejected" });
  } catch (error) {
    next(error);
  }
};

const logStockUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, stockId, quantity } = req.body;
    const user = req.user;

    const site = await SiteModel.findById(siteId);

    let stock;
    if (!site) {
      stock = await StockModel.findOne({ _id: stockId, site: null });
      if (!stock || stock.quantity < quantity)
        throw new ApiError("Insufficient stock", HttpStatus.BAD_REQUEST);
    } else {
      stock = await StockModel.findOne({ _id: stockId, site: siteId });
      if (!stock || stock.quantity < quantity)
        throw new ApiError("Insufficient stock", HttpStatus.BAD_REQUEST);
    }

    stock.quantity -= quantity;
    await stock.save();

    const usage = new StockUsageModel({
      site: siteId,
      stock: stockId,
      quantity,
      usedBy: user?.userId,
    });
    await usage.save();

    await bumpCacheVersion(STOCKS_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Stock usage logged" });
  } catch (error) {
    next(error);
  }
};

const getStocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 0;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";
    const siteScope =
      typeof req.query.site === "string" ? req.query.site.trim() : "";
    const isPaginated = page > 0 && limit > 0;

    const version = await getCacheVersion(STOCKS_CACHE_NAMESPACE);
    const paginationSuffix = isPaginated
      ? `:page:${page}:limit:${limit}:search:${search}:category:${category}:site:${siteScope}`
      : "";
    const cacheKey = `${STOCKS_CACHE_NAMESPACE}:v${version}${paginationSuffix}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const filter: Record<string, any> = {};
    if (search.length > 0) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category.length > 0) {
      filter.category = category;
    }
    if (siteScope === "company") {
      filter.site = null;
    } else if (siteScope.length > 0 && Types.ObjectId.isValid(siteScope)) {
      filter.site = siteScope;
    }

    let query = StockModel.find(filter).populate("site").sort({ name: 1 });
    if (isPaginated) {
      query = query.skip((page - 1) * limit).limit(limit);
    }
    const stocks = await query.lean();

    let responseBody: unknown = stocks;

    if (isPaginated) {
      const total = await StockModel.countDocuments(filter);
      responseBody = {
        stocks,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      };
    }

    await cacheSet(cacheKey, responseBody, STOCKS_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const getStocksBySite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const siteId = req.query.siteId as string;
    if (!siteId) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "Site ID is required." });
      return;
    }

    const stocks = await StockModel.find({ site: siteId }).populate("site");
    res.status(HttpStatus.OK).json(stocks);
  } catch (error) {
    next(error);
  }
};

const getStockTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    let filter: any = {};

    const transfers = await StockTransferModel.find(filter)
      .populate("stock")
      .populate("fromSite")
      .populate("toSite")
      .populate("requestedBy")
      .populate("approvedBy")
      .populate("rejectedBy");

    res.status(HttpStatus.OK).json(transfers);
  } catch (error) {
    next(error);
  }
};

const getStockUsages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    let filter: any = {};

    const currentUser = await UserModel.findById(user?.userId, "assignedSites");
    const assignedSites = currentUser?.assignedSites;

    if (user?.role === UserRole.SiteManager) {
      filter.site = { $in: assignedSites };
    }

    const usages = await StockUsageModel.find(filter)
      .populate("stock")
      .populate("site")
      .populate("usedBy");

    res.status(HttpStatus.OK).json(usages);
  } catch (error) {
    next(error);
  }
};

export default {
  getStocks,
  getStocksBySite,
  getStockTransfers,
  getStockUsages,
  addStock,
  requestStockTransfer,
  approveStockTransfer,
  rejectStockTransfer,
  logStockUsage,
};