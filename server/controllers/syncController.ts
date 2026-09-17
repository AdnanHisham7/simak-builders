import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { SyncMutationModel } from "@models/SyncMutation";
import { AttendanceModel } from "@models/Attendance";
import { SiteModel } from "@models/Site";
import { PurchaseModel } from "@models/Purchase";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { EmployeeModel } from "@models/Employee";
import { VendorModel } from "@models/Vendor";
import { ItemModel } from "@models/Item";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";
import { ActivityLogModel } from "@models/ActivityLog";
import { HttpStatus } from "@utils/enums/httpStatus";

interface IncomingMutation {
  clientMutationId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entity: "attendance" | "purchases" | "miscellaneousExpenses" | "sites";
  recordId: string;
  payload: any;
  createdAt: string;
}

interface MutationResult {
  clientMutationId: string;
  status: "synced" | "failed" | "conflict";
  serverId?: string;
  serverVersion?: number;
  error?: string;
}

export const pushSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mutations: IncomingMutation[] = req.body.mutations || [];
    const userId = req.user?.userId;
    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.isBlocked || user.isDeleted) {
      res.status(HttpStatus.FORBIDDEN).json({ message: "Account disabled or blocked" });
      return;
    }

    const userAssignedSiteIds = (user.assignedSites || []).map((id: any) =>
      id.toString()
    );
    const isAdmin = user.role === "admin";

    const results: MutationResult[] = [];

    for (const mutation of mutations) {
      const { clientMutationId, operation, entity, recordId, payload } = mutation;

      // 1. Idempotency Check
      const existingProcessed = await SyncMutationModel.findOne({ clientMutationId });
      if (existingProcessed) {
        results.push({
          clientMutationId,
          status: existingProcessed.status,
          serverId: existingProcessed.serverId,
          serverVersion: existingProcessed.serverVersion,
          error: existingProcessed.error,
        });
        continue;
      }

      try {
        // 2. Entity Handling
        if (entity === "attendance" && operation === "CREATE") {
          const { employeeId, siteId, date, status } = payload;
          if (typeof status !== "number" || status < 0 || status > 1) {
            throw new Error("Status must be between 0 and 1");
          }

          if (!isAdmin && !userAssignedSiteIds.includes(siteId)) {
            throw new Error("Not authorized for this site");
          }

          const employee = await EmployeeModel.findById(employeeId);
          if (!employee) throw new Error("Employee not found");

          const site = await SiteModel.findById(siteId);
          if (!site) throw new Error("Site not found");

          // Check for existing record
          const existingRecord = await AttendanceModel.findOne({
            employee: employeeId,
            site: siteId,
            date: new Date(date),
            deletedAt: null,
          });

          if (existingRecord) {
            results.push({
              clientMutationId,
              status: "conflict",
              serverId: existingRecord._id.toString(),
              serverVersion: existingRecord.version || 1,
              error: "Attendance already recorded for this date",
            });
            await SyncMutationModel.create({
              clientMutationId,
              entity,
              operation,
              recordId,
              userId: new Types.ObjectId(userId),
              status: "conflict",
              serverId: existingRecord._id.toString(),
              serverVersion: existingRecord.version || 1,
              error: "Attendance already recorded for this date",
            });
            continue;
          }

          const attendance = new AttendanceModel({
            employee: employeeId,
            site: siteId,
            date: new Date(date),
            status,
            dailyWage: employee.dailyWage,
            isPaid: false,
            markedBy: userId,
            clientMutationId,
            version: 1,
          });
          await attendance.save();

          const expense = status * employee.dailyWage;
          await SiteModel.findByIdAndUpdate(siteId, { $inc: { expenses: expense } });
          site.transactions.push({
            date: new Date(),
            amount: expense,
            type: "attendance",
            description: `Attendance for ${employee.name}`,
            relatedId: attendance._id,
            user: new Types.ObjectId(userId),
          });
          await site.save();

          await SyncMutationModel.create({
            clientMutationId,
            entity,
            operation,
            recordId,
            userId: new Types.ObjectId(userId),
            status: "synced",
            serverId: attendance._id.toString(),
            serverVersion: 1,
          });

          results.push({
            clientMutationId,
            status: "synced",
            serverId: attendance._id.toString(),
            serverVersion: 1,
          });
        } else if (entity === "purchases" && operation === "CREATE") {
          const {
            siteId,
            vendorId,
            paymentMethod,
            sourceOfFunds: reqSource,
            deductFromUserId,
            date: dateStr,
            transportationFee: transFee,
            notes,
            items,
            totalAmount,
          } = payload;

          if (siteId && !isAdmin && !userAssignedSiteIds.includes(siteId)) {
            throw new Error("Not authorized for this site");
          }

          let sourceOfFunds = reqSource;
          let deductUserId = deductFromUserId;
          if (paymentMethod === "cash") {
            if (!isAdmin) {
              sourceOfFunds = "siteManager";
              deductUserId = userId;
            }
          }

          const parsedTotal = parseFloat(totalAmount);
          const parsedTrans = parseFloat(transFee || "0") || 0;
          const purchaseDate = dateStr ? new Date(dateStr) : new Date();

          const purchase = new PurchaseModel({
            date: purchaseDate,
            site: siteId || null,
            vendor: vendorId,
            items: (items || []).map((item: any) => ({
              name: item.name,
              unit: item.unit,
              category: item.category,
              quantity: parseFloat(item.quantity) || 0,
              price: parseFloat(item.price) || 0,
              totalAmount: parseFloat(item.totalAmount) || 0,
            })),
            totalAmount: parsedTotal,
            transportationFee: parsedTrans,
            addedBy: userId,
            payment: {
              method: paymentMethod,
              isPaid: paymentMethod === "cash",
            },
            sourceOfFunds,
            deductFromUserId: deductUserId,
            notes: typeof notes === "string" ? notes.trim() : "",
            clientMutationId,
            status: "pending",
            version: 1,
          });
          await purchase.save();

          if (parsedTrans > 0 && siteId) {
            const misc = new MiscellaneousExpenseModel({
              site: siteId,
              category: "service",
              name: "Transportation Fee",
              amount: parsedTrans,
              tip: 0,
              notes: "from offline purchase sync",
              purchaseId: purchase._id,
              date: purchaseDate,
              addedBy: userId,
              status: "pending",
              sourceOfFunds,
              deductFromUserId: deductUserId,
              version: 1,
            });
            await misc.save();
          }

          // Admin notification
          const admins = await UserModel.find({ role: "admin" });
          for (const admin of admins) {
            await NotificationModel.create({
              user: admin._id,
              type: "purchase_verification",
              relatedId: purchase._id,
              message: `New purchase of ₹${purchase.totalAmount} synced offline needs verification`,
              status: "pending",
            });
          }

          await ActivityLogModel.create({
            user: userId,
            action: "create",
            resource: "purchase",
            resourceId: purchase._id,
            details: `Synced offline purchase for site ${siteId || "company"}`,
          });

          await SyncMutationModel.create({
            clientMutationId,
            entity,
            operation,
            recordId,
            userId: new Types.ObjectId(userId),
            status: "synced",
            serverId: purchase._id.toString(),
            serverVersion: 1,
          });

          results.push({
            clientMutationId,
            status: "synced",
            serverId: purchase._id.toString(),
            serverVersion: 1,
          });
        } else if (entity === "miscellaneousExpenses" && operation === "CREATE") {
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
          } = payload;

          if (siteId && !isAdmin && !userAssignedSiteIds.includes(siteId)) {
            throw new Error("Not authorized for this site");
          }

          let sourceOfFunds = reqSource;
          let deductUserId = deductFromUserId;
          if (!isAdmin) {
            sourceOfFunds = "siteManager";
            deductUserId = userId;
          }

          const parsedAmount = parseFloat(amount);
          const misc = new MiscellaneousExpenseModel({
            site: siteId,
            category,
            name,
            amount: parsedAmount,
            tip: parseFloat(tip) || 0,
            notes,
            date: date ? new Date(date) : new Date(),
            addedBy: userId,
            status: "pending",
            sourceOfFunds,
            deductFromUserId: deductUserId,
            paymentMethod,
            vendor: vendorId || undefined,
            clientMutationId,
            version: 1,
          });
          await misc.save();

          await SyncMutationModel.create({
            clientMutationId,
            entity,
            operation,
            recordId,
            userId: new Types.ObjectId(userId),
            status: "synced",
            serverId: misc._id.toString(),
            serverVersion: 1,
          });

          results.push({
            clientMutationId,
            status: "synced",
            serverId: misc._id.toString(),
            serverVersion: 1,
          });
        } else {
          // Unsupported or unimplemented mutation type
          results.push({
            clientMutationId,
            status: "failed",
            error: `Unsupported mutation: ${entity}.${operation}`,
          });
        }
      } catch (err: any) {
        const errorMessage = err.message || "Failed to process mutation";
        await SyncMutationModel.create({
          clientMutationId,
          entity,
          operation,
          recordId,
          userId: new Types.ObjectId(userId),
          status: "failed",
          error: errorMessage,
        });

        results.push({
          clientMutationId,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    res.status(HttpStatus.OK).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const pullSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user || user.isBlocked || user.isDeleted) {
      res.status(HttpStatus.FORBIDDEN).json({ message: "Account disabled or blocked" });
      return;
    }

    const lastSyncStr = (req.body.lastSyncTimestamp || req.query.since) as string;
    const sinceDate = lastSyncStr ? new Date(lastSyncStr) : new Date(0);
    const isValidDate = !isNaN(sinceDate.getTime());
    const filterDate = isValidDate ? sinceDate : new Date(0);

    const isAdmin = user.role === "admin";
    const userAssignedSiteIds = user.assignedSites || [];

    // Filter sites by role
    const siteQuery: any = { updatedAt: { $gt: filterDate } };
    if (!isAdmin) {
      siteQuery._id = { $in: userAssignedSiteIds };
    }

    // Filter attendance, purchases, expenses
    const subQuery: any = { updatedAt: { $gt: filterDate } };
    if (!isAdmin) {
      subQuery.site = { $in: userAssignedSiteIds };
    }

    const [sites, attendance, purchases, miscellaneousExpenses, employees, vendors, items] =
      await Promise.all([
        SiteModel.find(siteQuery)
          .populate("documents.uploadedBy", "name")
          .lean(),
        AttendanceModel.find(subQuery).lean(),
        PurchaseModel.find(subQuery).lean(),
        MiscellaneousExpenseModel.find(subQuery).lean(),
        EmployeeModel.find({ updatedAt: { $gt: filterDate } }).lean(),
        VendorModel.find({ updatedAt: { $gt: filterDate } }).lean(),
        ItemModel.find({ updatedAt: { $gt: filterDate } }).lean(),
      ]);

    res.status(HttpStatus.OK).json({
      serverTimestamp: new Date().toISOString(),
      changes: {
        sites,
        attendance,
        purchases,
        miscellaneousExpenses,
        employees,
        vendors,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(HttpStatus.OK).json({
      status: "ok",
      serverTime: new Date().toISOString(),
      userId: req.user?.userId,
      role: req.user?.role,
    });
  } catch (error) {
    next(error);
  }
};
