import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { AttendanceModel } from "@models/Attendance";
import { PurchaseModel } from "@models/Purchase";
import { StockModel } from "@models/Stock";
import { MachineryRentalModel } from "@models/MachineryRental";
import { CompanyModel } from "@models/Company";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { Schema, model } from "mongoose";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";

const ClientTransactionSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const ClientTransactionModel = model(
  "ClientTransaction",
  ClientTransactionSchema,
);

const getClientSites = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const clientId = req.user?.userId;
    const sites = await SiteModel.find({ client: clientId }).select("name _id");
    res.status(HttpStatus.OK).json(sites);
  } catch (error) {
    next(error);
  }
};

const getClientDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const clientId = req.user?.userId;
    const {
      siteId,
      purchasesPage = 1,
      purchasesLimit = 10,
      stocksPage = 1,
      stocksLimit = 10,
      rentalsPage = 1,
      rentalsLimit = 10,
      transactionsPage = 1,
      transactionsLimit = 10,
    } = req.query;

    const site = await SiteModel.findOne({ _id: siteId, client: clientId })
      .populate("documents.uploadedBy", "name")
      .populate("transactions.user", "name");
    if (!site) {
      throw new ApiError(
        "Site not found or not authorized",
        HttpStatus.NOT_FOUND,
      );
    }

    const purchases = await PurchaseModel.find({ site: site._id })
      .populate("vendor", "name")
      .populate("addedBy", "name")
      .skip((Number(purchasesPage) - 1) * Number(purchasesLimit))
      .limit(Number(purchasesLimit))
      .sort({ createdAt: -1 });
    const purchasesCount = await PurchaseModel.countDocuments({
      site: site._id,
    });

    const stocks = await StockModel.find({ site: site._id })
      .skip((Number(stocksPage) - 1) * Number(stocksLimit))
      .limit(Number(stocksLimit))
      .sort({ createdAt: -1 });
    const stocksCount = await StockModel.countDocuments({ site: site._id });

    const machineryRentals = await MachineryRentalModel.find({ site: site._id })
      .populate("addedBy", "name")
      .skip((Number(rentalsPage) - 1) * Number(rentalsLimit))
      .limit(Number(rentalsLimit))
      .sort({ createdAt: -1 });
    const machineryRentalsCount = await MachineryRentalModel.countDocuments({
      site: site._id,
    });

    const transactions = await ClientTransactionModel.find({
      client: clientId,
      site: site._id,
    })
      .populate("verifiedBy", "name")
      .skip((Number(transactionsPage) - 1) * Number(transactionsLimit))
      .limit(Number(transactionsLimit))
      .sort({ createdAt: -1 });
    const transactionsCount = await ClientTransactionModel.countDocuments({
      client: clientId,
      site: site._id,
    });

    const attendances = await AttendanceModel.find({ site: site._id })
      .populate("employee", "name position")
      .populate("markedBy", "name");

    res.status(HttpStatus.OK).json({
      site,
      attendances,
      purchases: { data: purchases, total: purchasesCount },
      stocks: { data: stocks, total: stocksCount },
      machineryRentals: {
        data: machineryRentals,
        total: machineryRentalsCount,
      },
      transactions: { data: transactions, total: transactionsCount },
    });
  } catch (error) {
    next(error);
  }
};

const sendMoneyToAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { amount, siteId } = req.body;
    const clientId = req.user?.userId;

    if (amount <= 0) {
      throw new ApiError("Amount must be positive", HttpStatus.BAD_REQUEST);
    }

    const site = await SiteModel.findOne({ _id: siteId, client: clientId });
    if (!site) {
      throw new ApiError(
        "Site not found or not authorized",
        HttpStatus.NOT_FOUND,
      );
    }

    const client = await UserModel.findById(clientId);
    if (!client) throw new ApiError("Client not found", HttpStatus.NOT_FOUND);

    const transaction = new ClientTransactionModel({
      client: clientId,
      site: siteId,
      amount,
    });
    await transaction.save();

    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "client_payment_verification",
        relatedId: transaction._id,
        message: `Client ${client.name} has sent a payment of ₹${amount} for site ${site.name} that needs verification`,
        status: "pending",
      });
      await notification.save();
    }

    res.status(HttpStatus.CREATED).json({
      message: "Transaction created, pending verification",
      transactionId: transaction._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyClientTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.user?.userId;

    const transaction: any =
      await ClientTransactionModel.findById(transactionId).populate("site");
    if (!transaction) {
      throw new ApiError("Transaction not found", HttpStatus.NOT_FOUND);
    }
    if (transaction.status === "verified") {
      throw new ApiError(
        "Transaction already verified",
        HttpStatus.BAD_REQUEST,
      );
    }

    const admin = await UserModel.findById(adminId);
    if (!admin) throw new ApiError("Admin not found", HttpStatus.NOT_FOUND);

    transaction.status = "verified";
    transaction.verifiedBy = adminId;
    transaction.verifiedAt = new Date();
    await transaction.save();

    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const site: any = transaction.site;
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    company.totalAmount += transaction.amount;
    company.transactions.push({
      date: new Date(),
      amount: transaction.amount,
      type: "incoming",
      description: `Client payment from ${transaction.client} for site ${site.name}`,
      site: site._id,
    });
    await company.save();

    site.budget += transaction.amount;
    await site.save();

    await NotificationModel.updateMany(
      { relatedId: transactionId, type: "client_payment_verification" },
      { status: "approved" },
    );

    const clientNotification = new NotificationModel({
      user: transaction.client,
      type: "payment_verified",
      relatedId: transaction._id,
      message: `Your payment of ₹${transaction.amount} for site ${site.name} has been verified by ${admin.name}`,
      status: "approved",
    });
    await clientNotification.save();

    res.status(HttpStatus.OK).json({
      message: "Transaction verified, company budget and site budget updated",
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionsForReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { clientId } = req.params;
    const transactions = await ClientTransactionModel.find({
      client: clientId,
    }).populate("verifiedBy", "name");
    res.status(HttpStatus.OK).json(transactions);
  } catch (error) {
    next(error);
  }
};

const getSiteClientTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    console.log("Fetching client transactions for site:", siteId);
    const site = await SiteModel.findById(siteId);
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    const transactions = await ClientTransactionModel.find({ site: siteId })
      .populate("client", "name email")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 });

    res.status(HttpStatus.OK).json(transactions);
  } catch (error) {
    next(error);
  }
};

const addManualClientPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const { amount } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
console.log("Adding manual client payment:", { siteId, amount, userId, userRole });
    if (!amount || amount <= 0) {
      throw new ApiError(
        "Amount must be a positive number",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!userId) {
      throw new ApiError("User not authenticated", HttpStatus.UNAUTHORIZED);
    }

    // Fetch the site
    const site = await SiteModel.findById(siteId);
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    // Authorization logic using assignedSites (correct way)
    let isAuthorized = false;

    if (userRole === "admin") {
      isAuthorized = true;
    } else if (userRole === "siteManager") {
      // Check if this site is in the user's assignedSites array
      const user =
        await UserModel.findById(userId).select("assignedSites role");
      if (!user) {
        throw new ApiError("User not found", HttpStatus.NOT_FOUND);
      }

      const isAssigned = user.assignedSites.some(
        (assignedSiteId: any) => assignedSiteId.toString() === siteId,
      );

      if (isAssigned) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ApiError(
        "Not authorized to record manual payment for this site",
        HttpStatus.FORBIDDEN,
      );
    }

    // Create verified client transaction
    const transaction = new ClientTransactionModel({
      client: site.client,
      site: siteId,
      amount: Number(amount),
      status: "verified",
      verifiedBy: userId,
      verifiedAt: new Date(),
    });

    await transaction.save();

    // Update Company total amount
    const company = await CompanyModel.findOne();
    if (company) {
      company.totalAmount = (company.totalAmount || 0) + Number(amount);
      company.transactions.push({
        date: new Date(),
        amount: Number(amount),
        type: "incoming",
        description: `Manual client payment recorded for site: ${site.name}`,
        site: site._id,
      });
      await company.save();
    }

    // Update Site budget
    site.budget = (site.budget || 0) + Number(amount);
    await site.save();

    // Notify the client (optional but recommended)
    const clientNotification = new NotificationModel({
      user: site.client,
      type: "payment_verified",
      relatedId: transaction._id,
      message: `₹${amount} has been added to the budget of site "${site.name}" by the team.`,
      status: "approved",
    });
    await clientNotification.save();

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Manual client payment recorded successfully",
      transaction,
      newSiteBudget: site.budget,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getClientDashboard,
  getClientSites,
  sendMoneyToAdmin,
  verifyClientTransaction,
  getTransactionsForReport,
  getSiteClientTransactions,
  addManualClientPayment,
};
