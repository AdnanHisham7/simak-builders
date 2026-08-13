import { Request, Response, NextFunction } from "express";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { CompanyModel } from "@models/Company";
import { SiteModel } from "@models/Site";
import { UserModel } from "@models/User";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { Types } from "mongoose";

const addMiscellaneousExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      siteId,
      category,
      name,
      amount,
      tip = 0,
      notes = "",
      date,
      sourceOfFunds: reqSource,
      deductFromUserId,
      paymentMethod = "cash",
      vendorId,
    } = req.body;

    const user = await UserModel.findById(req.user?.userId);
    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    const parsedAmount = parseFloat(amount);
    const parsedTip = parseFloat(tip) || 0;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new ApiError("Valid amount is required", HttpStatus.BAD_REQUEST);
    }
    if (!["machinery", "rental", "service", "material"].includes(category)) {
      throw new ApiError("Invalid category", HttpStatus.BAD_REQUEST);
    }

    if (!["cash", "credit"].includes(paymentMethod)) {
      throw new ApiError("Invalid payment method", HttpStatus.BAD_REQUEST);
    }
    if (paymentMethod === "credit" && !vendorId) {
      throw new ApiError(
        "Vendor is required for credit payment",
        HttpStatus.BAD_REQUEST,
      );
    }

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    // Determine source (no balance check, no deduction)
    let sourceOfFunds: string | undefined;
    let deductUserId: string | undefined;

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
      }
    } else if (user.role === "siteManager") {
      sourceOfFunds = "siteManager";
      deductUserId = req.user?.userId;
    } else {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const expense = new MiscellaneousExpenseModel({
      site: siteId,
      category,
      name,
      amount: parsedAmount,
      tip: parsedTip,
      notes,
      date: new Date(date),
      addedBy: req.user?.userId,
      status: "pending",
      sourceOfFunds,
      deductFromUserId,
      paymentMethod,
      vendor: vendorId || undefined,
    });

    await expense.save();

    // Notifications & Activity Log
    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "miscellaneous_expense_verification",
        relatedId: expense._id,
        message: `New ${category} expense (${name}) of ₹${parsedAmount} needs verification for site ${site.name}`,
        status: "pending",
      });
      await notification.save();
    }

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "miscellaneousExpense",
      resourceId: expense._id,
      details: `Added ${category} expense for site: ${site.name}`,
    });

    res.status(HttpStatus.CREATED).json({
      message: "Miscellaneous expense added (pending verification)",
      expenseId: expense._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyMiscellaneousExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { expenseId } = req.params;
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    // Atomically flip status pending -> verified in a single findOneAndUpdate.
    // This closes the race window that a plain findById + save left open:
    // two near-simultaneous verify requests (e.g. an accidental double click,
    // or a stale notification panel retried after the first click already
    // succeeded) could otherwise both read status "pending" before either
    // write landed, and both would then proceed to double-count the site
    // expense and the source-of-funds deduction below.
    const expense: any = await MiscellaneousExpenseModel.findOneAndUpdate(
      { _id: expenseId, status: { $ne: "verified" } },
      { $set: { status: "verified" } },
      { new: true },
    ).populate("site");

    if (!expense) {
      const stillExists = await MiscellaneousExpenseModel.exists({
        _id: expenseId,
      });
      if (!stillExists) {
        throw new ApiError("Expense not found", HttpStatus.NOT_FOUND);
      }
      throw new ApiError(
        "Expense is already verified",
        HttpStatus.BAD_REQUEST,
      );
    }

    const totalExpense = expense.amount + (expense.tip || 0);

    // Site record
    let updatedSiteExpenses: number | undefined;
    let newTransaction: any;
    if (expense.site) {
      const site = await SiteModel.findById(expense.site._id);
      const addedByUser = await UserModel.findById(expense.addedBy);
      if (site) {
        site.expenses += totalExpense;
        newTransaction = {
          date: new Date(),
          amount: totalExpense,
          type: "miscellaneous",
          description: `${expense.category} - ${expense.name} by ${addedByUser?.name}`,
          relatedId: expense._id,
          user: addedByUser?._id,
        };
        site.transactions.push(newTransaction);
        await site.save();
        updatedSiteExpenses = site.expenses;
        newTransaction = site.transactions[site.transactions.length - 1];
      }
    }

    // DEDUCTION ONLY ON VERIFICATION
    if (expense.sourceOfFunds) {
      if (expense.sourceOfFunds === "company") {
        const company = await CompanyModel.findOne();
        if (company) {
          company.totalAmount -= totalExpense; // can go negative
          company.transactions.push({
            date: new Date(),
            amount: -totalExpense,
            type: "expenditure",
            description: `${expense.category} - ${expense.name} for site ${expense.site?.name}`,
            site: expense.site?._id,
          });
          await company.save();
        }
      } else if (
        expense.sourceOfFunds === "siteManager" &&
        expense.deductFromUserId
      ) {
        const deductingUser = await UserModel.findById(
          expense.deductFromUserId,
        );
        if (deductingUser) {
          deductingUser.siteExpensesBalance -= totalExpense; // can go negative
          deductingUser.siteExpensesTransactions.push({
            date: new Date(),
            amount: -totalExpense,
            type: "expenditure",
            description: `${expense.category} - ${expense.name} for site ${expense.site?.name}`,
            site: expense.site?._id,
            givenBy: expense.addedBy,
          });
          await deductingUser.save();
        }
      }
    }

    // Notifications: mark the pending "needs verification" notification(s)
    // for this expense as approved so the notification panel stops showing
    // it as pending, and let the person who added it know it went through.
    await NotificationModel.updateMany(
      {
        relatedId: expense._id,
        type: "miscellaneous_expense_verification",
      },
      { status: "approved" },
    );
    const updateNotification = new NotificationModel({
      user: expense.addedBy,
      type: "miscellaneous_expense_update",
      relatedId: expense._id,
      message: `Your ${expense.category} expense (${expense.name}) of ₹${totalExpense} has been verified`,
      status: "approved",
    });
    await updateNotification.save();

    res.status(HttpStatus.OK).json({
      message: "Expense verified and funds deducted",
      expense,
      site:
        updatedSiteExpenses !== undefined
          ? { _id: expense.site?._id, expenses: updatedSiteExpenses }
          : undefined,
      transaction: newTransaction,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMiscellaneousExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { expenseId } = req.params;
    const expense: any = await MiscellaneousExpenseModel.findById(expenseId)
      .populate("site")
      .populate("vendor");

    if (!expense) throw new ApiError("Expense not found", HttpStatus.NOT_FOUND);

    // Authorization: admin or the user who added it
    if (
      req.user?.role !== "admin" &&
      req.user?.userId !== expense.addedBy.toString()
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const totalExpense = expense.amount + (expense.tip || 0);
    const wasVerified = expense.status === "verified";

    // If verified, perform accounting reversal
    let updatedSiteExpenses: number | undefined;
    if (wasVerified) {
      // 1. Reverse site expense
      const site = await SiteModel.findById(expense.site);
      if (site) {
        site.expenses -= totalExpense;
        // Add reversal transaction
        site.transactions.push({
          date: new Date(),
          amount: -totalExpense,
          type: "miscellaneous",
          description: `Reversal: Deleted miscellaneous expense (${expense.category} - ${expense.name})`,
          relatedId: new Types.ObjectId(expense._id),
          user: new Types.ObjectId(req.user?.userId),
        });
        await site.save();
        updatedSiteExpenses = site.expenses;
      }

      // 2. Reverse source deduction
      if (expense.sourceOfFunds === "company") {
        const company = await CompanyModel.findOne();
        if (company) {
          company.totalAmount += totalExpense;
          company.transactions.push({
            date: new Date(),
            amount: totalExpense,
            type: "reversal",
            description: `Reversal: Deleted miscellaneous expense (${expense.category} - ${expense.name}) for site ${expense.site?.name || ""}`,
            site: expense.site?._id,
          });
          await company.save();
        }
      } else if (
        expense.sourceOfFunds === "siteManager" &&
        expense.deductFromUserId
      ) {
        const user = await UserModel.findById(expense.deductFromUserId);
        if (user) {
          user.siteExpensesBalance += totalExpense;
          user.siteExpensesTransactions.push({
            date: new Date(),
            amount: totalExpense,
            type: "reversal",
            description: `Reversal: Deleted miscellaneous expense (${expense.category} - ${expense.name}) for site ${expense.site?.name || ""}`,
            site: expense.site?._id,
            givenBy: expense.addedBy,
          });
          await user.save();
        }
      }
    }

    // Delete the expense document
    await MiscellaneousExpenseModel.findByIdAndDelete(expenseId);

    // Close out any notifications still pointing at this expense so the
    // notification panel doesn't keep showing a "pending verification"
    // entry for an expense that no longer exists (which would otherwise
    // 404 forever if an admin tried to verify it from a stale panel).
    await NotificationModel.updateMany(
      {
        relatedId: expense._id,
        type: "miscellaneous_expense_verification",
        status: "pending",
      },
      { status: "rejected" },
    );

    // Activity log
    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "miscellaneousExpense",
      resourceId: expense._id,
      details: `Deleted ${wasVerified ? "verified" : "pending"} miscellaneous expense`,
    });

    res.status(HttpStatus.OK).json({
      message: `Miscellaneous expense deleted successfully${wasVerified ? " with accounting reversal" : ""}`,
      wasVerified,
      site:
        updatedSiteExpenses !== undefined
          ? { _id: expense.site, expenses: updatedSiteExpenses }
          : undefined,
    });
  } catch (error) {
    next(error);
  }
};

const updateMiscellaneousExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { expenseId } = req.params;
    const { name, category } = req.body;

    const expense: any = await MiscellaneousExpenseModel.findById(expenseId);
    if (!expense) throw new ApiError("Expense not found", HttpStatus.NOT_FOUND);

    if (
      req.user?.role !== "admin" &&
      req.user?.userId !== expense.addedBy.toString()
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    if (!name || !String(name).trim())
      throw new ApiError("Name is required", HttpStatus.BAD_REQUEST);
    if (!["machinery", "rental", "service", "material"].includes(category)) {
      throw new ApiError("Invalid category", HttpStatus.BAD_REQUEST);
    }

    const wasVerified = expense.status === "verified";

    expense.name = String(name).trim();
    expense.category = category;
    await expense.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "miscellaneousExpense",
      resourceId: expense._id,
      details: `Edited ${wasVerified ? "verified" : "unverified"} miscellaneous expense (name/category)`,
    });

    res.status(HttpStatus.OK).json({
      message: "Miscellaneous expense updated",
      expense,
    });
  } catch (error) {
    next(error);
  }
};

const getMiscellaneousExpensesBySite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.query;
    if (!siteId)
      throw new ApiError("siteId is required", HttpStatus.BAD_REQUEST);

    const expenses = await MiscellaneousExpenseModel.find({ site: siteId })
      .populate("addedBy", "name")
      .populate("purchaseId", "totalAmount date")
      .populate("vendor", "name")
      .sort({ date: -1 });

    res.status(HttpStatus.OK).json(expenses);
  } catch (error) {
    next(error);
  }
};

export default {
  addMiscellaneousExpense,
  getMiscellaneousExpensesBySite,
  verifyMiscellaneousExpense,
  updateMiscellaneousExpense,
  deleteMiscellaneousExpense,
};