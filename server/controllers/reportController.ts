import { Request, Response, NextFunction } from "express";
import { PurchaseModel } from "@models/Purchase";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { StockModel } from "@models/Stock";
import { VendorModel } from "@models/Vendor";
import { UserModel } from "@models/User";
import { SiteModel } from "@models/Site";
import { ClientTransactionModel } from "./clientController";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import mongoose, { Types } from "mongoose";

interface ExpenseSummary {
  transactions: Array<{
    _id: unknown;
    date: Date;
    amount: number;
    type: string;
    description?: string;
    relatedId?: unknown;
    user?: { _id: unknown; name?: string; email?: string; role?: string };
  }>;
  totalAmount: number;
  supervisionPercentage: number;
  supervisionAmount: number;
  netTotal: number;
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

// Removes transaction pairs that fully cancel each other out, such as a
// deleted purchase/expense's original transaction and the accounting
// reversal transaction generated when it was deleted. Both share the same
// relatedId (the id of the underlying purchase/expense/payment document)
// and their amounts sum to zero, so together they carry no net effect and
// must not surface in reports.
const excludeCancelledTransactionPairs = (txns: any[]): any[] => {
  const groupsByRelatedId = new Map<string, any[]>();

  for (const t of txns) {
    if (!t.relatedId) continue;
    const key = t.relatedId.toString();
    const group = groupsByRelatedId.get(key);
    if (group) {
      group.push(t);
    } else {
      groupsByRelatedId.set(key, [t]);
    }
  }

  const cancelledTransactions = new Set<any>();
  for (const group of groupsByRelatedId.values()) {
    if (group.length < 2) continue;
    const netAmount = group.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0,
    );
    if (roundToCents(netAmount) === 0) {
      for (const t of group) cancelledTransactions.add(t);
    }
  }

  if (cancelledTransactions.size === 0) return txns;
  return txns.filter((t) => !cancelledTransactions.has(t));
};

// Merges itemized rows that refer to the same item/description into a
// single row, summing quantity (where present) and amount, so the same
// named item — purchase item, miscellaneous expense, attendance entry, or
// any other itemized row — appearing multiple times within the report
// period appears only once. Quantity is only combined when at least one of
// the merged rows actually has a quantity; rows with no quantity at all
// (e.g. miscellaneous/attendance rows) stay blank after merging.
const mergeDuplicateItems = (rows: any[]): any[] => {
  const mergedByItemName = new Map<string, any>();
  const result: any[] = [];

  for (const row of rows) {
    const key = String(row.itemOfWork || "").trim().toLowerCase();

    if (!key) {
      result.push(row);
      continue;
    }

    const existing = mergedByItemName.get(key);
    if (existing) {
      const rowHasQuantity = row.quantity !== null && row.quantity !== undefined;
      const existingHasQuantity = existing.quantity !== null && existing.quantity !== undefined;

      if (rowHasQuantity || existingHasQuantity) {
        existing.quantity =
          Number(existingHasQuantity ? existing.quantity : 0) +
          Number(rowHasQuantity ? row.quantity : 0);
      }

      existing.amount = roundToCents(Number(existing.amount || 0) + Number(row.amount || 0));

      if (new Date(row.date).getTime() < new Date(existing.date).getTime()) {
        existing.date = row.date;
      }
    } else {
      const mergedRow = {
        ...row,
        quantity: row.quantity !== null && row.quantity !== undefined ? Number(row.quantity) : null,
        amount: roundToCents(Number(row.amount || 0)),
      };
      mergedByItemName.set(key, mergedRow);
      result.push(mergedRow);
    }
  }

  return result;
};

const buildExpenseSummary = async (
  site: any,
  supervisionPercentageParam?: string,
  startDate?: string,
  endDate?: string,
  isClientReport: boolean = false
): Promise<ExpenseSummary> => {
  let transactions: any[] = (site.transactions || []).map((t: any) =>
    typeof t.toObject === "function" ? t.toObject() : t,
  );

  // Deleted records (e.g. a deleted purchase/expense) leave behind their
  // original transaction plus a reversal transaction with the opposite
  // amount, linked by the same relatedId. The reversal is timestamped at
  // deletion time, which can fall outside the report's date range even
  // when the original transaction falls inside it (a purchase added in
  // January and deleted in March, reported on for January alone). Both
  // must be matched and excluded together against the FULL transaction
  // history, before any date-range filtering, so a deleted purchase never
  // leaks back into a report for a period before it was deleted.
  transactions = excludeCancelledTransactionPairs(transactions);

  if (startDate) {
    const start = new Date(startDate as string);
    transactions = transactions.filter((t) => new Date(t.date) >= start);
  }
  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    transactions = transactions.filter((t) => new Date(t.date) <= end);
  }

  let supervisionPercentage = Number(site.supervisionPercentage) || 0;
  if (
    supervisionPercentageParam !== undefined &&
    supervisionPercentageParam !== null &&
    supervisionPercentageParam !== ""
  ) {
    const parsed = parseFloat(supervisionPercentageParam);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      throw new ApiError(
        "Supervision percentage must be a number between 0 and 100",
        HttpStatus.BAD_REQUEST,
      );
    }
    supervisionPercentage = parsed;
  }

  // Build itemized transaction array for rows
  const expandedTransactions: any[] = [];

  // Batch query detailed documents for efficiency
  const purchaseIds = transactions.filter(t => t.type === "purchase" && t.relatedId).map(t => t.relatedId);
  const miscIds = transactions.filter(t => t.type === "miscellaneous" && t.relatedId).map(t => t.relatedId);

  const [purchasesDocs, miscDocs] = await Promise.all([
    PurchaseModel.find({ _id: { $in: purchaseIds } }).lean(),
    MiscellaneousExpenseModel.find({ _id: { $in: miscIds } }).lean()
  ]);

  const purchaseMap = new Map(purchasesDocs.map(p => [p._id.toString(), p]));
  const miscMap = new Map(miscDocs.map(m => [m._id.toString(), m]));

  for (const t of transactions) {
    if (t.type === "attendance") {
      // Client Report hides attendance rows completely, and since totals
      // are now derived from the shown rows, hidden attendance amounts no
      // longer contribute to the Client Report's total either.
      if (isClientReport) {
        continue;
      }
      expandedTransactions.push({
        ...t,
        itemOfWork: t.description || "Attendance Expense",
        quantity: null // Make quantity blank
      });
    } else if (t.type === "purchase") {
      const detailedPurchase = t.relatedId ? purchaseMap.get(t.relatedId.toString()) : null;
      
      if (detailedPurchase && detailedPurchase.items && detailedPurchase.items.length > 0) {
        // Create an entry per purchase item to show the exact item name and quantity
        detailedPurchase.items.forEach((item: any) => {
          expandedTransactions.push({
            ...t,
            date: detailedPurchase.date || t.date,
            itemOfWork: item.name,
            quantity: item.quantity,
            amount: item.totalAmount // Cost for this item row specifically
          });
        });
      } else {
        expandedTransactions.push({
          ...t,
          itemOfWork: t.description || "Purchase",
          quantity: null
        });
      }
    } else if (t.type === "miscellaneous") {
      const detailedMisc = t.relatedId ? miscMap.get(t.relatedId.toString()) : null;
      expandedTransactions.push({
        ...t,
        itemOfWork: detailedMisc ? detailedMisc.name : (t.description || "Miscellaneous Expense"),
        quantity: null // Quantity remains blank for miscellaneous expenses
      });
    } else {
      expandedTransactions.push({
        ...t,
        itemOfWork: t.description || t.type,
        quantity: null
      });
    }
  }

  // Combine duplicate item rows (same item/description name, any type)
  // into a single summed row so the same item appearing multiple times
  // within the report period shows only once.
  const mergedTransactions = mergeDuplicateItems(expandedTransactions);

  // Final chronological sort for itemized lines
  mergedTransactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Total Amount is the sum of exactly the rows shown in the report above,
  // after cancelled-pair exclusion, client-report attendance hiding, and
  // duplicate-item merging. Supervision and Net Total are derived from
  // this same shown total, so every figure in the report is internally
  // consistent with what the person is actually looking at.
  const totalAmount = roundToCents(
    mergedTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );

  const supervisionAmount = roundToCents((totalAmount * supervisionPercentage) / 100);
  const netTotal = roundToCents(totalAmount + supervisionAmount);

  return {
    transactions: mergedTransactions,
    totalAmount,
    supervisionPercentage,
    supervisionAmount,
    netTotal,
  };
};

// Stock Transactions Report
export const getStockTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
    const miscellaneousExpenses = await MiscellaneousExpenseModel.find(
      filter,
    ).populate("addedBy", "name email role");

    const transactions = [
      ...purchases.map((p) => ({ ...p.toObject(), type: "purchase" })),
      ...miscellaneousExpenses.map((exp) => ({
        ...exp.toObject(),
        type: "miscellaneous",
        totalAmount: exp.amount + (exp.tip || 0),
      })),
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
  next: NextFunction,
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
      "name address",
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
  next: NextFunction,
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
  next: NextFunction,
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
  next: NextFunction,
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

// Expense Report (per-site itemized expenses with supervision calculation)
export const getExpenseReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, supervisionPercentage, startDate, endDate } =
      req.query as {
        siteId?: string;
        supervisionPercentage?: string;
        startDate?: string;
        endDate?: string;
      };

    if (!siteId || !Types.ObjectId.isValid(siteId)) {
      throw new ApiError("Valid site ID is required", HttpStatus.BAD_REQUEST);
    }

    const site: any = await SiteModel.findById(siteId)
      .populate("transactions.user", "name email role")
      .populate("client", "name email");
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    // Await updated async helper
    const summary = await buildExpenseSummary(
      site,
      supervisionPercentage,
      startDate,
      endDate,
      false // isClientReport = false
    );

    res.status(HttpStatus.OK).json({
      site: {
        id: site._id,
        name: site.name,
        address: site.address,
        city: site.city,
        state: site.state,
        zip: site.zip,
        status: site.status,
        client: site.client
        ? { id: site.client._id, name: site.client.name }
          : null,
      },
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

// Client Report (per-site expense statement with supervision, amount received, and balance)
export const getClientReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, supervisionPercentage, startDate, endDate } =
      req.query as {
        siteId?: string;
        supervisionPercentage?: string;
        startDate?: string;
        endDate?: string;
      };

    if (!siteId || !Types.ObjectId.isValid(siteId)) {
      throw new ApiError("Valid site ID is required", HttpStatus.BAD_REQUEST);
    }

    const site: any = await SiteModel.findById(siteId)
      .populate("transactions.user", "name email role")
      .populate("client", "name email");
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    // Await updated async helper with client report formatting enabled
    const summary = await buildExpenseSummary(
      site,
      supervisionPercentage,
      startDate,
      endDate,
      true // isClientReport = true
    );

    const varavAggregate = await ClientTransactionModel.aggregate([
      {
        $match: {
          site: new Types.ObjectId(siteId),
          status: "verified",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const varav = Number((varavAggregate[0]?.total || 0).toFixed(2));
    const balance = Number((summary.netTotal - varav).toFixed(2));

    res.status(HttpStatus.OK).json({
      site: {
        id: site._id,
        name: site.name,
        address: site.address,
        city: site.city,
        state: site.state,
        zip: site.zip,
        status: site.status,
        client: site.client
          ? { id: site.client._id, name: site.client.name }
          : null,
      },
      ...summary,
      varav,
      balance,
    });
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
  getExpenseReport,
  getClientReport,
};