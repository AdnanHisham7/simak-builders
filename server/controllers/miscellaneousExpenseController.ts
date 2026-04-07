import { Request, Response, NextFunction } from "express";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { CompanyModel } from "@models/Company";
import { SiteModel } from "@models/Site";
import { UserModel } from "@models/User";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

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
    } = req.body;
    const user = await UserModel.findById(req.user?.userId);
    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    const parsedAmount = parseFloat(amount);
    const parsedTip = parseFloat(tip) || 0;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new ApiError("Valid amount is required", HttpStatus.BAD_REQUEST);
    }
    if (!["machinery", "rental", "service"].includes(category)) {
      throw new ApiError("Invalid category", HttpStatus.BAD_REQUEST);
    }

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    // Balance check (on amount only)
    if (user.role === "siteManager") {
      if (user.siteExpensesBalance < parsedAmount) {
        throw new ApiError(
          "Insufficient site expenses balance",
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (user.role === "admin") {
      const company = await CompanyModel.findOne();
      if (company && company.totalAmount < parsedAmount) {
        throw new ApiError(
          "Insufficient company funds",
          HttpStatus.BAD_REQUEST,
        );
      }
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
    });
    await expense.save();

    // Notifications & Activity Log (update messages)
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

    // Deduct from balance (amount only)
    if (user.role === "siteManager") {
      const transaction: any = {
        date: new Date(),
        amount: -parsedAmount,
        type: "expenditure",
        description: `${category} - ${name}`,
        site: siteId,
      };
      user.siteExpensesTransactions.push(transaction);
      user.siteExpensesBalance -= parsedAmount;
      await user.save();
    } else if (user.role === "admin") {
      const company = await CompanyModel.findOne();
      if (company) {
        company.totalAmount -= parsedAmount;
        company.transactions.push({
          date: new Date(),
          amount: -parsedAmount,
          type: "expenditure",
          description: `${category} - ${name} for site ${site.name}`,
          site: siteId,
        });
        await company.save();
      }
    }

    res.status(HttpStatus.CREATED).json({
      message: "Miscellaneous expense added",
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
    const user = req.user;
    if (user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const expense: any =
      await MiscellaneousExpenseModel.findById(expenseId).populate("site");
    if (!expense) throw new ApiError("Expense not found", HttpStatus.NOT_FOUND);

    expense.status = "verified";
    await expense.save();

    // Update notifications...

    const totalExpense = expense.amount + (expense.tip || 0);

    if (expense.site) {
      const site = await SiteModel.findById(expense.site._id);
      const addedByUser = await UserModel.findById(expense.addedBy);

      if (site) {
        site.expenses += totalExpense; // ← Total (amount + tip)

        site.transactions.push({
          date: new Date(),
          amount: totalExpense,
          type: "miscellaneous", // or keep "rental" if you prefer
          description: `${expense.category} - ${expense.name} by ${addedByUser?.name}`,
          relatedId: expense._id,
          user: addedByUser?._id.toString(),
        });
        await site.save();
      }
    }

    res
      .status(HttpStatus.OK)
      .json({ message: "Expense verified successfully" });
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
};
