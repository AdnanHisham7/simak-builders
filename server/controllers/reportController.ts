import { Request, Response, NextFunction } from "express";
import { PurchaseModel } from "@models/Purchase";
import { MachineryRentalModel } from "@models/MachineryRental";
import { StockModel } from "@models/Stock";
import { VendorModel } from "@models/Vendor";
import { UserModel } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import mongoose, { Types } from "mongoose";

// Stock Transactions Report
export const getStockTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, startDate, endDate, type, minAmount } = req.query;
    if (!siteId)
      throw new ApiError("Site ID is required", HttpStatus.BAD_REQUEST);

    const filter: any = { site: siteId };
    if (startDate) filter.date = { $gte: new Date(startDate as string) };
    if (endDate)
      filter.date = { ...filter.date, $lte: new Date(endDate as string) };
    if (type) filter.type = type;
    if (minAmount)
      filter.totalAmount = { $gte: parseFloat(minAmount as string) };

    const purchases = await PurchaseModel.find(filter)
      .populate("vendor", "name email phone")
      .populate("addedBy", "name email role");
    const rentals = await MachineryRentalModel.find(filter).populate(
      "addedBy",
      "name email role"
    );

    const transactions = [
      ...purchases.map((p) => ({ ...p.toObject(), type: "purchase" })),
      ...rentals.map((r) => ({ ...r.toObject(), type: "rental" })),
    ];

    res.status(HttpStatus.OK).json(transactions);
  } catch (error) {
    next(error);
  }
};

// Stock Inventory Report
export const getStockInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, category, minQuantity, name } = req.query;
    const filter: any = {};
    if (siteId) filter.site = siteId;
    if (category) filter.category = category;
    if (minQuantity)
      filter.quantity = { $gte: parseInt(minQuantity as string) };
    if (name) filter.name = { $regex: name, $options: "i" };

    const stocks = await StockModel.find(filter).populate(
      "site",
      "name address"
    );
    res.status(HttpStatus.OK).json(stocks);
  } catch (error) {
    next(error);
  }
};

// Vendors Report
export const getVendorsReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, minAmount, search } = req.query;
    const filter: any = {};
    if (siteId) filter.site = siteId;
    if (minAmount)
      filter.totalAmount = { $gte: parseFloat(minAmount as string) };
    if (search) filter.name = { $regex: search, $options: "i" };

    const vendors = await VendorModel.aggregate([
      {
        $lookup: {
          from: "purchases",
          localField: "_id",
          foreignField: "vendor",
          as: "purchases",
        },
      },
      {
        $addFields: {
          totalPurchases: { $size: "$purchases" },
          totalAmount: { $sum: "$purchases.totalAmount" },
        },
      },
      { $match: filter },
      { $project: { purchases: 0 } },
    ]);

    res.status(HttpStatus.OK).json(vendors);
  } catch (error) {
    next(error);
  }
};

const getClientsReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId, status, minAmount, startDate, endDate } = req.query as {
      clientId?: string;
      status?: string;
      minAmount?: string;
      startDate?: string;
      endDate?: string;
    };

    const filter: Record<string, any> = { role: "client" };

    if (clientId && Types.ObjectId.isValid(clientId)) {
      filter._id = new Types.ObjectId(clientId);
    }

    if (status) {
      filter.status = status;
    }

    const clients = await UserModel.aggregate([
      { $match: { role: "client" } },
      {
        $lookup: {
          from: "sites",
          localField: "_id",
          foreignField: "client",
          as: "sites",
        },
      },
      {
        $lookup: {
          from: "clienttransactions",
          localField: "_id",
          foreignField: "client",
          as: "transactions",
        },
      },
      {
        $addFields: {
          totalTransactions: { $size: "$transactions" },
          totalAmount: { $sum: "$transactions.amount" },
          status: { $arrayElemAt: ["$transactions.status", -1] },
          site: { $arrayElemAt: ["$sites", 0] },
        },
      },
      { $match: filter },
      {
        $project: {
          password: 0,
          refreshToken: 0,
          sites: 0,
          ...(clientId ? {} : { transactions: 0 }),
        },
      },
    ]);

    res.json(clients);
  } catch (err) {
    console.error("Error in getClientsReport:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vendorId } = req.query;
    if (!vendorId) {
      throw new ApiError("Vendor ID is required", HttpStatus.BAD_REQUEST);
    }

    const purchases = await PurchaseModel.find({ vendor: vendorId })
      .populate("vendor", "name email phone")
      .populate("addedBy", "name email role");

    res.status(HttpStatus.OK).json(purchases);
  } catch (error) {
    next(error);
  }
};

export default {
  getStockTransactions,
  getStockInventory,
  getVendorsReport,
  getVendorPurchases,
  getClientsReport,
};
