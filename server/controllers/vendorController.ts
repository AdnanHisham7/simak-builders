import { Request, Response, NextFunction } from "express";
import { VendorModel } from "@models/Vendor";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";
import { PurchaseModel } from "@models/Purchase";
import { ActivityLogModel } from "@models/ActivityLog";
import { CompanyModel } from "@models/Company";

const getVendors = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
                in: "$$unpaidPurchase.totalAmount",
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
    res.status(HttpStatus.OK).json(vendors);
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
    const user = req.user;
    if (user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      throw new ApiError("Vendor not found", HttpStatus.NOT_FOUND);
    }
    const unpaidPurchases = await PurchaseModel.find({
      vendor: id,
      "payment.method": "credit",
      "payment.isPaid": false,
    });
    const totalOutstanding = unpaidPurchases.reduce(
      (sum, purchase) => sum + purchase.totalAmount,
      0
    );
    if (totalOutstanding <= 0) {
      res
        .status(HttpStatus.OK)
        .json({ message: "No outstanding amount to settle" });
      return;
    }
    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (company.totalAmount < totalOutstanding) {
      throw new ApiError("Insufficient company funds", HttpStatus.BAD_REQUEST);
    }
    company.totalAmount -= totalOutstanding;
    const transaction = {
      date: new Date(),
      amount: -totalOutstanding,
      type: "expenditure",
      description: `Payment to vendor ${vendor.name} for outstanding credit purchases`,
      vendor: id,
    };
    company.transactions.push(transaction);
    await company.save();
    await PurchaseModel.updateMany(
      { vendor: id, "payment.method": "credit", "payment.isPaid": false },
      { "payment.isPaid": true }
    );
    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "settle_payment",
      resource: "vendor",
      resourceId: id,
      details: `Settled outstanding amount of ${totalOutstanding} for vendor ${vendor.name}`,
    });
    res
      .status(HttpStatus.OK)
      .json({ message: "Outstanding amount settled successfully" });
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
