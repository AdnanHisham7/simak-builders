import { Request, Response, NextFunction } from "express";
import { VendorModel } from "@models/Vendor";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";
import { PurchaseModel } from "@models/Purchase";
import { ActivityLogModel } from "@models/ActivityLog";
import { CompanyModel } from "@models/Company";
import {
  cacheGet,
  cacheSet,
  bumpCacheVersion,
  getCacheVersion,
} from "@config/redis";

const VENDORS_CACHE_NAMESPACE = "vendors";
const VENDORS_CACHE_TTL_SECONDS = 20;

const getVendors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 0;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const isPaginated = page > 0 && limit > 0;

    const version = await getCacheVersion(VENDORS_CACHE_NAMESPACE);
    const paginationSuffix = isPaginated
      ? `:page:${page}:limit:${limit}:search:${search}`
      : "";
    const cacheKey = `${VENDORS_CACHE_NAMESPACE}:v${version}${paginationSuffix}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const searchMatchStage =
      search.length > 0
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { phone: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : [];
    const sortStage = isPaginated ? [{ $sort: { name: 1 as const } }] : [];
    const paginationStages = isPaginated
      ? [{ $skip: (page - 1) * limit }, { $limit: limit }]
      : [];

    const vendors = await VendorModel.aggregate([
      ...searchMatchStage,
      ...sortStage,
      ...paginationStages,
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
          outstandingAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$purchases",
                    as: "purchase",
                    cond: {
                      $and: [
                        { $eq: ["$$purchase.payment.method", "credit"] },
                        { $eq: ["$$purchase.payment.isPaid", false] },
                      ],
                    },
                  },
                },
                as: "unpaidPurchase",
                in: {
                  $subtract: [
                    "$$unpaidPurchase.totalAmount",
                    { $ifNull: ["$$unpaidPurchase.payment.paidAmount", 0] },
                  ],
                },
              },
            },
          },
          status: "active",
        },
      },
      {
        $project: {
          purchases: 0,
        },
      },
    ]);

    let responseBody: unknown = vendors;

    if (isPaginated) {
      const countMatch =
        search.length > 0
          ? {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
              ],
            }
          : {};
      const total = await VendorModel.countDocuments(countMatch);
      responseBody = {
        vendors,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      };
    }

    await cacheSet(cacheKey, responseBody, VENDORS_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      throw new ApiError("Vendor not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(vendor);
  } catch (error) {
    next(error);
  }
};

const createVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      throw new ApiError("Missing required fields", HttpStatus.BAD_REQUEST);
    }
    const newVendor = await VendorModel.create({ name, email, phone });
    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "vendor",
      resourceId: newVendor._id,
      details: `Created vendor: ${newVendor.name}`,
    });
    await bumpCacheVersion(VENDORS_CACHE_NAMESPACE);
    res.status(HttpStatus.CREATED).json(newVendor);
  } catch (error) {
    next(error);
  }
};

const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedVendor = await VendorModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedVendor) {
      throw new ApiError("Vendor not found", HttpStatus.NOT_FOUND);
    }
    await bumpCacheVersion(VENDORS_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json(updatedVendor);
  } catch (error) {
    next(error);
  }
};

const deleteVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedVendor = await VendorModel.findByIdAndDelete(id);
    if (!deletedVendor) {
      throw new ApiError("Vendor not found", HttpStatus.NOT_FOUND);
    }
    await bumpCacheVersion(VENDORS_CACHE_NAMESPACE);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

const getPurchasesByVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const purchases = await PurchaseModel.find({ vendor: id }).populate("site");
    res.status(HttpStatus.OK).json(purchases);
  } catch (error) {
    next(error);
  }
};

const settleVendorPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    const user = req.user;
    if (user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      throw new ApiError("Vendor not found", HttpStatus.NOT_FOUND);
    }

    const settleAmount = Number(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      throw new ApiError(
        "Settlement amount must be greater than zero",
        HttpStatus.BAD_REQUEST,
      );
    }

    const unpaidPurchases = await PurchaseModel.find({
      vendor: id,
      "payment.method": "credit",
      "payment.isPaid": false,
    }).sort({ date: 1 });

    const totalOutstanding = unpaidPurchases.reduce(
      (sum, purchase) =>
        sum + (purchase.totalAmount - (purchase.payment.paidAmount || 0)),
      0
    );

    if (totalOutstanding <= 0) {
      res
        .status(HttpStatus.OK)
        .json({ message: "No outstanding amount to settle" });
      return;
    }

    if (settleAmount > totalOutstanding) {
      throw new ApiError(
        `Settlement amount (${settleAmount}) exceeds the outstanding balance (${totalOutstanding}) for this vendor`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (company.totalAmount < settleAmount) {
      throw new ApiError("Insufficient company funds", HttpStatus.BAD_REQUEST);
    }

    // Allocate the settlement across the vendor's unpaid credit purchases,
    // oldest first, until the settled amount is exhausted. A purchase is
    // only marked isPaid once its paidAmount reaches its totalAmount, so
    // partial payments correctly leave the remainder outstanding for the
    // next settlement.
    let remaining = settleAmount;
    for (const purchase of unpaidPurchases) {
      if (remaining <= 0) break;
      
      const alreadyPaid = purchase.payment.paidAmount || 0;
      const due = purchase.totalAmount - alreadyPaid;
      if (due <= 0) continue;
      
      const applied = Math.min(due, remaining);
      const newPaidAmount = alreadyPaid + applied;
      const isPaid = newPaidAmount >= purchase.totalAmount;
      
      remaining -= applied;

      // Use updateOne to safely bypass validation on unrelated fields like 'items'
      await PurchaseModel.updateOne(
        { _id: purchase._id },
        {
          $set: {
            "payment.paidAmount": newPaidAmount,
            "payment.isPaid": isPaid
          }
        }
      );
    }

    company.totalAmount -= settleAmount;
    const transaction = {
      date: new Date(),
      amount: -settleAmount,
      type: "expenditure",
      description: `Payment to vendor ${vendor.name}${
        notes ? ` — ${String(notes).trim()}` : ""
      }`,
      vendor: id,
    };
    company.transactions.push(transaction);
    await company.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "settle_payment",
      resource: "vendor",
      resourceId: id,
      details: `Settled ${settleAmount} of ${totalOutstanding} outstanding for vendor ${vendor.name}`,
    });
    await bumpCacheVersion(VENDORS_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({
      message: "Payment settled successfully",
      settledAmount: settleAmount,
      remainingOutstanding: totalOutstanding - settleAmount,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getPurchasesByVendor,
  settleVendorPayments,
};