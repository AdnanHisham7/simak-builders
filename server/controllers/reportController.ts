import { Request, Response, NextFunction } from "express";
import { PurchaseModel } from "@models/Purchase";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { StockModel } from "@models/Stock";
import { VendorModel } from "@models/Vendor";
import { UserModel } from "@models/User";
import { SiteModel } from "@models/Site";
import { ClientTransactionModel } from "@models/ClientTransaction";
import { ContractorModel } from "@models/Contractor";
import { ContractorTransactionModel } from "@models/ContractorTransaction";
import { EmployeeModel } from "@models/Employee";
import { AttendanceModel } from "@models/Attendance";
import { CompanyModel } from "@models/Company";
import { LenderModel } from "@models/Lender";
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const parseDateRange = (query: any) => {
  const { year, month, startDate, endDate, date } = query;
  let start: Date | undefined = undefined;
  let end: Date | undefined = undefined;

  if (date) {
    start = new Date(date);
    start.setHours(0, 0, 0, 0);
    end = new Date(date);
    end.setHours(23, 59, 59, 999);
  } else if (startDate || endDate) {
    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }
  } else if (year) {
    const yr = parseInt(year);
    if (month && month !== "all") {
      const m = parseInt(month) - 1;
      start = new Date(yr, m, 1, 0, 0, 0, 0);
      end = new Date(yr, m + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(yr, 0, 1, 0, 0, 0, 0);
      end = new Date(yr, 11, 31, 23, 59, 59, 999);
    }
  }

  const filter: any = {};
  if (start && !isNaN(start.getTime())) filter.$gte = start;
  if (end && !isNaN(end.getTime())) filter.$lte = end;
  return { start, end, filter: Object.keys(filter).length > 0 ? filter : null };
};

// 1. Annual Financial & Executive Report
export const getAnnualFinancialReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.query as { siteId?: string };
    const { start, end, filter: dateFilter } = parseDateRange(req.query);

    const siteMatch: any = {};
    if (siteId && siteId !== "all" && Types.ObjectId.isValid(siteId)) {
      siteMatch.site = new Types.ObjectId(siteId);
    }

    const clientQuery: any = { status: "verified", ...siteMatch };
    const purchaseQuery: any = { status: "verified", ...siteMatch };
    const miscQuery: any = { status: "verified", ...siteMatch };
    const contractorQuery: any = { ...siteMatch };
    const attendanceQuery: any = { ...siteMatch };

    if (dateFilter) {
      clientQuery.transactionDate = dateFilter;
      purchaseQuery.date = dateFilter;
      miscQuery.date = dateFilter;
      contractorQuery.date = dateFilter;
      attendanceQuery.date = dateFilter;
    }

    const [clientTxns, purchases, miscExpenses, contractorTxns, attendanceRows, allSites] =
      await Promise.all([
        ClientTransactionModel.find(clientQuery).populate("site", "name"),
        PurchaseModel.find(purchaseQuery).populate("site", "name"),
        MiscellaneousExpenseModel.find(miscQuery).populate("site", "name"),
        ContractorTransactionModel.find(contractorQuery).populate("site", "name"),
        AttendanceModel.find(attendanceQuery).populate("site", "name"),
        SiteModel.find({}, "name address client status"),
      ]);

    const totalRevenue = roundToCents(
      clientTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    );
    const materialSpend = roundToCents(
      purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
    );
    const miscSpend = roundToCents(
      miscExpenses.reduce((sum, m) => sum + (Number(m.amount) || 0) + (Number(m.tip) || 0), 0)
    );
    const contractorSpend = roundToCents(
      contractorTxns.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    );
    const laborSpend = roundToCents(
      attendanceRows.reduce((sum, a) => sum + (Number(a.status || 0) * Number(a.dailyWage || 0)), 0)
    );

    const totalExpenses = roundToCents(
      materialSpend + miscSpend + contractorSpend + laborSpend
    );
    const netProfit = roundToCents(totalRevenue - totalExpenses);
    const margin = totalRevenue > 0 ? roundToCents((netProfit / totalRevenue) * 100) : 0;

    // Monthly Trend Map
    const monthlyMap = new Map<number, { revenue: number; expense: number; materials: number; contractors: number; labor: number; misc: number }>();
    for (let i = 0; i < 12; i++) {
      monthlyMap.set(i, { revenue: 0, expense: 0, materials: 0, contractors: 0, labor: 0, misc: 0 });
    }

    clientTxns.forEach((t: any) => {
      const m = new Date(t.transactionDate || t.createdAt || Date.now()).getMonth();
      const current = monthlyMap.get(m)!;
      current.revenue = roundToCents(current.revenue + (Number(t.amount) || 0));
    });

    purchases.forEach((p) => {
      const m = new Date(p.date).getMonth();
      const current = monthlyMap.get(m)!;
      const amt = Number(p.totalAmount) || 0;
      current.materials = roundToCents(current.materials + amt);
      current.expense = roundToCents(current.expense + amt);
    });

    contractorTxns.forEach((c) => {
      const m = new Date(c.date).getMonth();
      const current = monthlyMap.get(m)!;
      const amt = Number(c.amount) || 0;
      current.contractors = roundToCents(current.contractors + amt);
      current.expense = roundToCents(current.expense + amt);
    });

    attendanceRows.forEach((a) => {
      const m = new Date(a.date).getMonth();
      const current = monthlyMap.get(m)!;
      const amt = (Number(a.status) || 0) * (Number(a.dailyWage) || 0);
      current.labor = roundToCents(current.labor + amt);
      current.expense = roundToCents(current.expense + amt);
    });

    miscExpenses.forEach((mx) => {
      const m = new Date(mx.date).getMonth();
      const current = monthlyMap.get(m)!;
      const amt = (Number(mx.amount) || 0) + (Number(mx.tip) || 0);
      current.misc = roundToCents(current.misc + amt);
      current.expense = roundToCents(current.expense + amt);
    });

    const monthlyTrends = Array.from(monthlyMap.entries()).map(([mIndex, data]) => ({
      month: MONTH_NAMES[mIndex],
      revenue: data.revenue,
      expense: data.expense,
      profit: roundToCents(data.revenue - data.expense),
      margin: data.revenue > 0 ? roundToCents(((data.revenue - data.expense) / data.revenue) * 100) : 0,
      materials: data.materials,
      contractors: data.contractors,
      labor: data.labor,
      misc: data.misc,
    }));

    // Site Comparison
    const siteMap = new Map<string, { name: string; revenue: number; expense: number }>();
    allSites.forEach((s) => {
      siteMap.set(s._id.toString(), { name: s.name, revenue: 0, expense: 0 });
    });

    clientTxns.forEach((t) => {
      if (t.site) {
        const id = (t.site as any)._id?.toString() || t.site.toString();
        if (siteMap.has(id)) {
          siteMap.get(id)!.revenue = roundToCents(siteMap.get(id)!.revenue + (Number(t.amount) || 0));
        }
      }
    });

    purchases.forEach((p) => {
      if (p.site) {
        const id = (p.site as any)._id?.toString() || p.site.toString();
        if (siteMap.has(id)) {
          siteMap.get(id)!.expense = roundToCents(siteMap.get(id)!.expense + (Number(p.totalAmount) || 0));
        }
      }
    });

    miscExpenses.forEach((m) => {
      if (m.site) {
        const id = (m.site as any)._id?.toString() || m.site.toString();
        if (siteMap.has(id)) {
          siteMap.get(id)!.expense = roundToCents(siteMap.get(id)!.expense + (Number(m.amount) || 0) + (Number(m.tip) || 0));
        }
      }
    });

    contractorTxns.forEach((c) => {
      if (c.site) {
        const id = (c.site as any)._id?.toString() || c.site.toString();
        if (siteMap.has(id)) {
          siteMap.get(id)!.expense = roundToCents(siteMap.get(id)!.expense + (Number(c.amount) || 0));
        }
      }
    });

    attendanceRows.forEach((a) => {
      if (a.site) {
        const id = (a.site as any)._id?.toString() || a.site.toString();
        if (siteMap.has(id)) {
          siteMap.get(id)!.expense = roundToCents(siteMap.get(id)!.expense + ((Number(a.status) || 0) * (Number(a.dailyWage) || 0)));
        }
      }
    });

    const siteComparison = Array.from(siteMap.entries()).map(([id, data]) => ({
      siteId: id,
      siteName: data.name,
      revenue: data.revenue,
      expense: data.expense,
      profit: roundToCents(data.revenue - data.expense),
      margin: data.revenue > 0 ? roundToCents(((data.revenue - data.expense) / data.revenue) * 100) : 0,
    }));

    const categoryBreakdown = [
      { name: "Material Purchases", value: materialSpend, color: "#3B82F6" },
      { name: "Contractor Payouts", value: contractorSpend, color: "#F59E0B" },
      { name: "Labor & Staff Wages", value: laborSpend, color: "#10B981" },
      { name: "Site Miscellaneous", value: miscSpend, color: "#8B5CF6" },
    ].filter((item) => item.value > 0);

    res.status(HttpStatus.OK).json({
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        margin,
        materialSpend,
        contractorSpend,
        laborSpend,
        miscSpend,
      },
      monthlyTrends,
      categoryBreakdown,
      siteComparison,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Salary & Payroll Analytics Report
export const getSalaryPayrollReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, employeeId } = req.query as { siteId?: string; employeeId?: string };
    const { filter: dateFilter } = parseDateRange(req.query);

    const query: any = {};
    if (siteId && siteId !== "all" && Types.ObjectId.isValid(siteId)) {
      query.site = new Types.ObjectId(siteId);
    }
    if (employeeId && employeeId !== "all" && Types.ObjectId.isValid(employeeId)) {
      query.employee = new Types.ObjectId(employeeId);
    }
    if (dateFilter) {
      query.date = dateFilter;
    }

    const attendanceRecords = await AttendanceModel.find(query)
      .populate("employee", "name phone email position dailyWage")
      .populate("site", "name")
      .sort({ date: -1 });

    const employeeMap = new Map<string, any>();
    const roleMap = new Map<string, number>();
    const monthlyMap = new Map<number, { total: number; paid: number; pending: number }>();
    for (let i = 0; i < 12; i++) {
      monthlyMap.set(i, { total: 0, paid: 0, pending: 0 });
    }

    let totalDisbursed = 0;
    let totalPending = 0;
    let totalGrossEarned = 0;
    let totalManDays = 0;

    attendanceRecords.forEach((record) => {
      const emp: any = record.employee;
      const empId = emp?._id?.toString() || "unknown";
      const empName = emp?.name || "Unknown Worker";
      const empPos = emp?.position || "Worker";
      const dailyWage = Number(record.dailyWage || emp?.dailyWage || 0);
      const daysWorked = Number(record.status || 0);
      const earned = roundToCents(daysWorked * dailyWage);
      const isPaid = Boolean(record.isPaid);
      const paid = isPaid ? earned : 0;
      const pending = isPaid ? 0 : earned;

      totalGrossEarned = roundToCents(totalGrossEarned + earned);
      totalDisbursed = roundToCents(totalDisbursed + paid);
      totalPending = roundToCents(totalPending + pending);
      totalManDays += daysWorked;

      // Group by Employee
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          name: empName,
          phone: emp?.phone || "",
          position: empPos,
          dailyWage,
          totalDays: 0,
          totalEarned: 0,
          totalPaid: 0,
          pendingAmount: 0,
        });
      }
      const existing = employeeMap.get(empId);
      existing.totalDays = roundToCents(existing.totalDays + daysWorked);
      existing.totalEarned = roundToCents(existing.totalEarned + earned);
      existing.totalPaid = roundToCents(existing.totalPaid + paid);
      existing.pendingAmount = roundToCents(existing.totalEarned - existing.totalPaid);

      // Group by Role
      roleMap.set(empPos, roundToCents((roleMap.get(empPos) || 0) + earned));

      // Group by Month
      const m = new Date(record.date).getMonth();
      const monthData = monthlyMap.get(m)!;
      monthData.total = roundToCents(monthData.total + earned);
      monthData.paid = roundToCents(monthData.paid + paid);
      monthData.pending = roundToCents(monthData.pending + pending);
    });

    const roleDistribution = Array.from(roleMap.entries()).map(([role, amount]) => ({
      name: role,
      value: amount,
    }));

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([mIndex, data]) => ({
      month: MONTH_NAMES[mIndex],
      totalWage: data.total,
      paidAmount: data.paid,
      pendingAmount: data.pending,
    }));

    const employeeRegister = Array.from(employeeMap.values()).sort(
      (a, b) => b.totalEarned - a.totalEarned
    );

    res.status(HttpStatus.OK).json({
      kpis: {
        totalGrossEarned,
        totalDisbursed,
        totalPending,
        totalManDays,
        activeEmployees: employeeRegister.length,
      },
      roleDistribution,
      monthlyTrend,
      employeeRegister,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Comprehensive Vendor Procurement Report
export const getComprehensiveVendorsReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, vendorId, paymentStatus } = req.query as {
      siteId?: string;
      vendorId?: string;
      paymentStatus?: string;
    };
    const { filter: dateFilter } = parseDateRange(req.query);

    const query: any = { status: "verified" };
    if (siteId && siteId !== "all") {
      if (siteId === "company") {
        query.site = null;
      } else if (Types.ObjectId.isValid(siteId)) {
        query.site = new Types.ObjectId(siteId);
      }
    }
    if (vendorId && vendorId !== "all" && Types.ObjectId.isValid(vendorId)) {
      query.vendor = new Types.ObjectId(vendorId);
    }
    if (paymentStatus && paymentStatus !== "all") {
      if (paymentStatus === "paid") query["payment.isPaid"] = true;
      if (paymentStatus === "credit") query["payment.isPaid"] = false;
    }
    if (dateFilter) {
      query.date = dateFilter;
    }

    const purchases = await PurchaseModel.find(query)
      .populate("vendor", "name phone email")
      .populate("site", "name")
      .sort({ date: -1 });

    let totalAmount = 0;
    let totalPaid = 0;
    let totalCredit = 0;

    const vendorMap = new Map<string, any>();
    const categoryMap = new Map<string, number>();
    const monthlyMap = new Map<number, { total: number; paid: number; credit: number }>();
    for (let i = 0; i < 12; i++) {
      monthlyMap.set(i, { total: 0, paid: 0, credit: 0 });
    }

    purchases.forEach((p) => {
      const amt = Number(p.totalAmount) || 0;
      const paid = p.payment?.isPaid ? amt : Number(p.payment?.paidAmount || 0);
      const balance = Math.max(0, amt - paid);

      totalAmount = roundToCents(totalAmount + amt);
      totalPaid = roundToCents(totalPaid + paid);
      totalCredit = roundToCents(totalCredit + balance);

      // Monthly Trend
      const m = new Date(p.date).getMonth();
      const monthData = monthlyMap.get(m)!;
      monthData.total = roundToCents(monthData.total + amt);
      monthData.paid = roundToCents(monthData.paid + paid);
      monthData.credit = roundToCents(monthData.credit + balance);

      // Vendor grouping
      const v: any = p.vendor;
      const vId = v?._id?.toString() || "unknown";
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, {
          vendorId: vId,
          name: v?.name || "Unknown Vendor",
          phone: v?.phone || "",
          invoiceCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
        });
      }
      const vendorSummary = vendorMap.get(vId);
      vendorSummary.invoiceCount += 1;
      vendorSummary.totalAmount = roundToCents(vendorSummary.totalAmount + amt);
      vendorSummary.paidAmount = roundToCents(vendorSummary.paidAmount + paid);
      vendorSummary.balance = roundToCents(vendorSummary.totalAmount - vendorSummary.paidAmount);

      // Category spend
      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          const cat = item.category || "General";
          const itemAmt = Number(item.totalAmount ?? (item.price * item.quantity) ?? 0);
          categoryMap.set(cat, roundToCents((categoryMap.get(cat) || 0) + itemAmt));
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthlySpendTrend = Array.from(monthlyMap.entries()).map(([mIndex, data]) => ({
      month: MONTH_NAMES[mIndex],
      totalAmount: data.total,
      paidAmount: data.paid,
      creditAmount: data.credit,
    }));

    const topVendors = Array.from(vendorMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    const purchasesList = purchases.map((p) => ({
      id: p._id,
      date: p.date,
      vendorName: (p.vendor as any)?.name || "Unknown",
      siteName: (p.site as any)?.name || "Company Warehouse",
      itemsCount: p.items?.length || 0,
      totalAmount: p.totalAmount,
      paymentMethod: p.payment?.method || "cash",
      isPaid: Boolean(p.payment?.isPaid),
      billUrl: p.billUpload?.url || "",
      notes: p.notes || "",
    }));

    res.status(HttpStatus.OK).json({
      kpis: {
        totalPurchasesAmount: totalAmount,
        totalPaid,
        totalCredit,
        totalInvoices: purchases.length,
      },
      categoryBreakdown,
      monthlySpendTrend,
      topVendors,
      purchases: purchasesList,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Comprehensive Contractor Work & Payout Report
export const getComprehensiveContractorsReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, contractorId, type } = req.query as {
      siteId?: string;
      contractorId?: string;
      type?: string;
    };
    const { filter: dateFilter } = parseDateRange(req.query);

    const txQuery: any = {};
    const contractorFilter: any = {};

    if (siteId && siteId !== "all" && Types.ObjectId.isValid(siteId)) {
      txQuery.site = new Types.ObjectId(siteId);
      contractorFilter["siteAssignments.site"] = new Types.ObjectId(siteId);
    }
    if (contractorId && contractorId !== "all" && Types.ObjectId.isValid(contractorId)) {
      txQuery.contractor = new Types.ObjectId(contractorId);
      contractorFilter._id = new Types.ObjectId(contractorId);
    }
    if (type && type !== "all") {
      txQuery.type = type;
    }
    if (dateFilter) {
      txQuery.date = dateFilter;
    }

    const [transactions, contractorsList] = await Promise.all([
      ContractorTransactionModel.find(txQuery)
        .populate("contractor", "name phone category totalContractAmount")
        .populate("site", "name")
        .sort({ date: -1 }),
      ContractorModel.find(contractorFilter).populate("siteAssignments.site", "name"),
    ]);

    let totalAdvances = 0;
    let totalExpenses = 0;
    let totalAdditional = 0;

    const monthlyMap = new Map<number, { advance: number; expense: number; additional: number; total: number }>();
    for (let i = 0; i < 12; i++) {
      monthlyMap.set(i, { advance: 0, expense: 0, additional: 0, total: 0 });
    }

    const contractorMap = new Map<string, any>();
    (contractorsList as any[]).forEach((c) => {
      const contractAmount = c.siteAssignments?.reduce(
        (sum: number, a: any) => {
          const assignedSiteId = a.site?._id ? a.site._id.toString() : a.site?.toString();
          return !siteId || siteId === "all" || assignedSiteId === siteId
            ? sum + Number(a.totalAmount || 0)
            : sum;
        },
        0
      ) || 0;

      const assignedSites = (c.siteAssignments || [])
        .filter((a: any) => {
          const assignedSiteId = a.site?._id ? a.site._id.toString() : a.site?.toString();
          return !siteId || siteId === "all" || assignedSiteId === siteId;
        })
        .map((a: any) => (a.site as any)?.name)
        .filter(Boolean);

      const siteName = assignedSites.length > 0 ? assignedSites.join(", ") : "Contracted Sites";

      contractorMap.set(c._id.toString(), {
        contractorId: c._id,
        name: c.name,
        phone: c.phone || "",
        category: c.company || "Contractor",
        siteName,
        contractAmount,
        advances: 0,
        expenses: 0,
        additional: 0,
        netPaid: 0,
        balance: contractAmount,
      });
    });

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const m = new Date(tx.date).getMonth();
      const monthData = monthlyMap.get(m)!;

      if (tx.type === "advance") {
        totalAdvances = roundToCents(totalAdvances + amt);
        monthData.advance = roundToCents(monthData.advance + amt);
      } else if (tx.type === "expense") {
        totalExpenses = roundToCents(totalExpenses + amt);
        monthData.expense = roundToCents(monthData.expense + amt);
      } else if (tx.type === "additional_payment") {
        totalAdditional = roundToCents(totalAdditional + amt);
        monthData.additional = roundToCents(monthData.additional + amt);
      }
      monthData.total = roundToCents(monthData.total + amt);

      const cId = (tx.contractor as any)?._id?.toString() || tx.contractor?.toString();
      if (cId) {
        if (!contractorMap.has(cId)) {
          contractorMap.set(cId, {
            contractorId: cId,
            name: (tx.contractor as any)?.name || "Unknown Contractor",
            phone: (tx.contractor as any)?.phone || "",
            category: (tx.contractor as any)?.category || "Contractor",
            siteName: (tx.site as any)?.name || "Contracted Sites",
            contractAmount: 0,
            advances: 0,
            expenses: 0,
            additional: 0,
            netPaid: 0,
            balance: 0,
          });
        }
        const item = contractorMap.get(cId);
        if (tx.type === "advance") item.advances = roundToCents(item.advances + amt);
        if (tx.type === "expense") item.expenses = roundToCents(item.expenses + amt);
        if (tx.type === "additional_payment") item.additional = roundToCents(item.additional + amt);
        item.netPaid = roundToCents(item.advances + item.additional);
        item.balance = roundToCents(item.contractAmount - item.netPaid);
      }
    });

    const totalContractValue = roundToCents(
      Array.from(contractorMap.values()).reduce((sum, c) => sum + (Number(c.contractAmount) || 0), 0)
    );
    const totalPaid = roundToCents(totalAdvances + totalAdditional);
    const pendingBalance = roundToCents(totalContractValue - totalPaid);

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([mIndex, data]) => ({
      month: MONTH_NAMES[mIndex],
      advance: data.advance,
      expense: data.expense,
      additional: data.additional,
      total: data.total,
    }));

    const typeDistribution = [
      { name: "Advance Payments", value: totalAdvances, color: "#3B82F6" },
      { name: "Verified Work Expenses", value: totalExpenses, color: "#10B981" },
      { name: "Additional Payments", value: totalAdditional, color: "#F59E0B" },
    ].filter((item) => item.value > 0);

    const contractorSummaries = Array.from(contractorMap.values()).sort(
      (a, b) => b.contractAmount - a.contractAmount
    );

    const txList = transactions.map((t) => ({
      id: t._id,
      date: t.date,
      contractorName: (t.contractor as any)?.name || "Unknown",
      siteName: (t.site as any)?.name || "General",
      type: t.type,
      amount: t.amount,
      description: t.description || "",
      category: (t.contractor as any)?.category || t.category || "",
    }));

    res.status(HttpStatus.OK).json({
      kpis: {
        totalContractValue,
        totalAdvances,
        totalExpenses,
        totalAdditional,
        totalPaid,
        pendingBalance,
        totalContractors: contractorsList.length,
      },
      monthlyTrend,
      typeDistribution,
      contractorSummaries,
      transactions: txList,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Capital Infusion & Debt / Lender Analytics Report
export const getCapitalLendersReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lenderId, capitalType } = req.query as {
      lenderId?: string;
      capitalType?: string;
    };
    const { filter: dateFilter } = parseDateRange(req.query);

    const company = await CompanyModel.findOne()
      .populate("transactions.lender", "name phone")
      .populate("transactions.settlementFor", "name phone");

    const lenders = await LenderModel.find().sort({ outstandingBalance: -1 });

    let allTxns: any[] = company ? [...company.transactions] : [];
    if (dateFilter) {
      allTxns = allTxns.filter((t: any) => {
        const d = new Date(t.date);
        if (dateFilter.$gte && d < dateFilter.$gte) return false;
        if (dateFilter.$lte && d > dateFilter.$lte) return false;
        return true;
      });
    }

    let filteredTxns = allTxns.filter((t: any) => t.isCapitalInfusion || t.settlementFor);

    if (capitalType && capitalType !== "all") {
      if (capitalType === "settlement") {
        filteredTxns = filteredTxns.filter((t: any) => t.settlementFor);
      } else {
        filteredTxns = filteredTxns.filter((t: any) => t.capitalType === capitalType);
      }
    }

    if (lenderId && lenderId !== "all") {
      filteredTxns = filteredTxns.filter((t: any) => {
        const lId = t.lender?._id?.toString() || t.lender?.toString() || t.settlementFor?._id?.toString() || t.settlementFor?.toString();
        return lId === lenderId;
      });
    }

    let totalOwnCapital = 0;
    let totalLendedCapital = 0;
    let totalSettled = 0;

    const monthlyMap = new Map<number, { own: number; lended: number; settlement: number }>();
    for (let i = 0; i < 12; i++) {
      monthlyMap.set(i, { own: 0, lended: 0, settlement: 0 });
    }

    filteredTxns.forEach((t: any) => {
      const amt = Math.abs(Number(t.amount) || 0);
      const m = new Date(t.date).getMonth();
      const monthData = monthlyMap.get(m)!;

      if (t.isCapitalInfusion) {
        if (t.capitalType === "lended") {
          totalLendedCapital = roundToCents(totalLendedCapital + amt);
          monthData.lended = roundToCents(monthData.lended + amt);
        } else {
          totalOwnCapital = roundToCents(totalOwnCapital + amt);
          monthData.own = roundToCents(monthData.own + amt);
        }
      } else if (t.settlementFor) {
        totalSettled = roundToCents(totalSettled + amt);
        monthData.settlement = roundToCents(monthData.settlement + amt);
      }
    });

    const totalInfused = roundToCents(totalOwnCapital + totalLendedCapital);
    const totalOutstandingDebt = roundToCents(
      lenders.reduce((sum, l) => sum + (Number(l.outstandingBalance) || 0), 0)
    );

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([mIndex, data]) => ({
      month: MONTH_NAMES[mIndex],
      ownInfusion: data.own,
      lendedInfusion: data.lended,
      settlement: data.settlement,
    }));

    const capitalDistribution = [
      { name: "Own Capital", value: totalOwnCapital, color: "#10B981" },
      { name: "Lended Capital", value: totalLendedCapital, color: "#3B82F6" },
      { name: "Settled / Repaid", value: totalSettled, color: "#8B5CF6" },
    ].filter((item) => item.value > 0);

    const lenderSummaries = lenders.map((l) => ({
      id: l._id,
      name: l.name,
      phone: l.phone || "",
      notes: l.notes || "",
      totalLended: l.totalLended,
      totalSettled: l.totalSettled,
      outstandingBalance: l.outstandingBalance,
    }));

    const transactionsList = filteredTxns.map((t: any) => ({
      id: t._id,
      date: t.date,
      type: t.settlementFor ? "Settlement" : "Infusion",
      category: t.settlementFor ? "Settlement" : t.capitalType === "lended" ? "Lended (Loan)" : "Own Capital",
      amount: Math.abs(t.amount),
      lenderName: t.lenderName || (t.lender as any)?.name || (t.settlementFor as any)?.name || "Owner",
      description: t.description || "",
    }));

    res.status(HttpStatus.OK).json({
      kpis: {
        totalInfused,
        totalOwnCapital,
        totalLendedCapital,
        totalSettled,
        totalOutstandingDebt,
        activeLenders: lenders.length,
      },
      monthlyTrend,
      capitalDistribution,
      lenderSummaries,
      transactions: transactionsList,
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
  getAnnualFinancialReport,
  getSalaryPayrollReport,
  getComprehensiveVendorsReport,
  getComprehensiveContractorsReport,
  getCapitalLendersReport,
};