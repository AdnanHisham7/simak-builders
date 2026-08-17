import { Request, Response, NextFunction } from "express";
import { ExpenseRequestModel } from "@models/ExpenseRequest";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { SiteModel } from "@models/Site";
import { CompanyModel } from "@models/Company";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";
import { ActivityLogModel } from "@models/ActivityLog";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const EXPENSE_CATEGORIES = ["machinery", "rental", "service", "material"];
const REQUEST_STATUSES = ["pending", "approved", "rejected"];

const parsePagination = (query: Request["query"]) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};

const createExpenseRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "architect") {
      throw new ApiError(
        "Only architects can raise expense requests",
        HttpStatus.FORBIDDEN,
      );
    }

    const architectId = req.user.userId;
    const { siteId, title, description, category, amount } = req.body;

    if (!siteId) {
      throw new ApiError("Site is required", HttpStatus.BAD_REQUEST);
    }

    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      throw new ApiError("Title is required", HttpStatus.BAD_REQUEST);
    }
    if (trimmedTitle.length > 150) {
      throw new ApiError("Title is too long", HttpStatus.BAD_REQUEST);
    }

    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw new ApiError("Invalid category", HttpStatus.BAD_REQUEST);
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new ApiError(
        "Amount must be a positive number",
        HttpStatus.BAD_REQUEST,
      );
    }

    const architect = await UserModel.findById(architectId).select(
      "name assignedSites",
    );
    if (!architect) {
      throw new ApiError("Architect not found", HttpStatus.NOT_FOUND);
    }

    const isAssigned = architect.assignedSites.some(
      (assignedSiteId: any) => assignedSiteId.toString() === siteId,
    );
    if (!isAssigned) {
      throw new ApiError(
        "You are not assigned to this site",
        HttpStatus.FORBIDDEN,
      );
    }

    const site = await SiteModel.findById(siteId).select("name");
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    const trimmedDescription =
      typeof description === "string" ? description.trim().slice(0, 2000) : "";

    const expenseRequest = await ExpenseRequestModel.create({
      architect: architectId,
      site: siteId,
      title: trimmedTitle,
      description: trimmedDescription,
      category,
      amount: parsedAmount,
    });

    const admins = await UserModel.find({ role: "admin" });
    await Promise.all(
      admins.map((admin) =>
        NotificationModel.create({
          user: admin._id,
          type: "expense_request_submitted",
          relatedId: expenseRequest._id,
          message: `${architect.name} requested ₹${parsedAmount} (${category}) for site "${site.name}"`,
          status: "pending",
        }),
      ),
    );

    res.status(HttpStatus.CREATED).json({
      message: "Expense request submitted",
      expenseRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getMyExpenseRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "architect") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { siteId, status } = req.query;
    const { page, limit } = parsePagination(req.query);

    const filter: Record<string, unknown> = { architect: req.user.userId };
    if (siteId) filter.site = siteId;
    if (status && REQUEST_STATUSES.includes(String(status))) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      ExpenseRequestModel.find(filter)
        .populate("site", "name")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ExpenseRequestModel.countDocuments(filter),
    ]);

    res.status(HttpStatus.OK).json({ data, total, page, limit });
  } catch (error) {
    next(error);
  }
};

const getAllExpenseRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { siteId, status } = req.query;
    const { page, limit } = parsePagination(req.query);

    const filter: Record<string, unknown> = {};
    if (siteId) filter.site = siteId;
    if (status && REQUEST_STATUSES.includes(String(status))) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      ExpenseRequestModel.find(filter)
        .populate("architect", "name email")
        .populate("site", "name")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ExpenseRequestModel.countDocuments(filter),
    ]);

    const pendingCount = await ExpenseRequestModel.countDocuments({
      status: "pending",
    });

    res.status(HttpStatus.OK).json({ data, total, page, limit, pendingCount });
  } catch (error) {
    next(error);
  }
};

const approveExpenseRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { expenseRequestId } = req.params;
    const adminId = req.user.userId;

    const expenseRequest: any = await ExpenseRequestModel.findOneAndUpdate(
      { _id: expenseRequestId, status: "pending" },
      {
        $set: {
          status: "approved",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    ).populate("site");

    if (!expenseRequest) {
      const stillExists = await ExpenseRequestModel.exists({
        _id: expenseRequestId,
      });
      if (!stillExists) {
        throw new ApiError(
          "Expense request not found",
          HttpStatus.NOT_FOUND,
        );
      }
      throw new ApiError(
        "Expense request has already been reviewed",
        HttpStatus.BAD_REQUEST,
      );
    }

    const site = await SiteModel.findById(expenseRequest.site._id);
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    const expense = await MiscellaneousExpenseModel.create({
      site: site._id,
      category: expenseRequest.category,
      name: expenseRequest.title,
      amount: expenseRequest.amount,
      notes: expenseRequest.description,
      date: new Date(),
      addedBy: expenseRequest.architect,
      status: "verified",
      sourceOfFunds: "company",
      paymentMethod: "cash",
    });

    expenseRequest.expenseId = expense._id;
    await expenseRequest.save();

    site.expenses += expenseRequest.amount;
    site.transactions.push({
      date: new Date(),
      amount: expenseRequest.amount,
      type: "miscellaneous",
      description: `${expenseRequest.category} - ${expenseRequest.title} (architect request)`,
      relatedId: expense._id,
      user: expenseRequest.architect,
    });
    await site.save();

    const company = await CompanyModel.findOne();
    if (company) {
      company.totalAmount -= expenseRequest.amount;
      company.transactions.push({
        date: new Date(),
        amount: -expenseRequest.amount,
        type: "expenditure",
        description: `${expenseRequest.category} - ${expenseRequest.title} for site ${site.name}`,
        site: site._id,
      });
      await company.save();
    }

    await NotificationModel.updateMany(
      { relatedId: expenseRequest._id, type: "expense_request_submitted" },
      { status: "approved" },
    );
    await NotificationModel.create({
      user: expenseRequest.architect,
      type: "expense_request_reviewed",
      relatedId: expenseRequest._id,
      message: `Your expense request "${expenseRequest.title}" for ₹${expenseRequest.amount} has been approved`,
      status: "approved",
    });

    await ActivityLogModel.create({
      user: adminId,
      action: "update",
      resource: "expenseRequest",
      resourceId: expenseRequest._id,
      details: `Approved expense request "${expenseRequest.title}" for site ${site.name}`,
    });

    res.status(HttpStatus.OK).json({
      message: "Expense request approved",
      expenseRequest,
    });
  } catch (error) {
    next(error);
  }
};

const rejectExpenseRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { expenseRequestId } = req.params;
    const { reviewNotes } = req.body;
    const adminId = req.user.userId;

    const trimmedNotes =
      typeof reviewNotes === "string" ? reviewNotes.trim().slice(0, 1000) : "";

    const expenseRequest = await ExpenseRequestModel.findOneAndUpdate(
      { _id: expenseRequestId, status: "pending" },
      {
        $set: {
          status: "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNotes: trimmedNotes,
        },
      },
      { new: true },
    );

    if (!expenseRequest) {
      const stillExists = await ExpenseRequestModel.exists({
        _id: expenseRequestId,
      });
      if (!stillExists) {
        throw new ApiError(
          "Expense request not found",
          HttpStatus.NOT_FOUND,
        );
      }
      throw new ApiError(
        "Expense request has already been reviewed",
        HttpStatus.BAD_REQUEST,
      );
    }

    await NotificationModel.updateMany(
      { relatedId: expenseRequest._id, type: "expense_request_submitted" },
      { status: "rejected" },
    );
    await NotificationModel.create({
      user: expenseRequest.architect,
      type: "expense_request_reviewed",
      relatedId: expenseRequest._id,
      message: `Your expense request "${expenseRequest.title}" for ₹${expenseRequest.amount} has been rejected${
        expenseRequest.reviewNotes ? `: ${expenseRequest.reviewNotes}` : ""
      }`,
      status: "rejected",
    });

    await ActivityLogModel.create({
      user: adminId,
      action: "update",
      resource: "expenseRequest",
      resourceId: expenseRequest._id,
      details: `Rejected expense request "${expenseRequest.title}"`,
    });

    res.status(HttpStatus.OK).json({
      message: "Expense request rejected",
      expenseRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingExpenseRequestCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const count = await ExpenseRequestModel.countDocuments({
      status: "pending",
    });
    res.status(HttpStatus.OK).json({ count });
  } catch (error) {
    next(error);
  }
};

export default {
  createExpenseRequest,
  getMyExpenseRequests,
  getAllExpenseRequests,
  approveExpenseRequest,
  rejectExpenseRequest,
  getPendingExpenseRequestCount,
};