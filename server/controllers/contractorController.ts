import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ContractorModel } from "@models/Contractor";
import { ContractorTransactionModel } from "@models/ContractorTransaction";
import { ActivityLogModel } from "@models/ActivityLog";
import { Types } from "mongoose";
import { CompanyModel } from "@models/Company";
import { UserModel } from "@models/User";
import { sign } from "crypto";
import {
  cacheGet,
  cacheSet,
  bumpCacheVersion,
  getCacheVersion,
} from "@config/redis";

const CONTRACTORS_CACHE_NAMESPACE = "contractors";
const CONTRACTORS_CACHE_TTL_SECONDS = 20;

const createContractor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, phone, company } = req.body;
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const existingContractor = await ContractorModel.findOne({ email });
    if (existingContractor)
      throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);

    const contractor = new ContractorModel({
      name,
      email,
      phone,
      company,
      status: "active",
      siteAssignments: [],
    });
    await contractor.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "contractor",
      resourceId: contractor._id,
      details: `Created contractor: ${contractor.name}`,
    });

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.CREATED).json({
      message: "Contractor created successfully",
      contractor: {
        id: contractor._id,
        name,
        email,
        phone,
        company,
        status: contractor.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllContractors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 0;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status =
      typeof req.query.status === "string" ? req.query.status.trim() : "";
    const company =
      typeof req.query.company === "string" ? req.query.company.trim() : "";
    const sortField = ["name", "company", "email", "status"].includes(
      req.query.sortBy as string,
    )
      ? (req.query.sortBy as "name" | "company" | "email" | "status")
      : "name";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const isPaginated = page > 0 && limit > 0;

    const version = await getCacheVersion(CONTRACTORS_CACHE_NAMESPACE);
    const paginationSuffix = isPaginated
      ? `:page:${page}:limit:${limit}:search:${search}:status:${status}:company:${company}:sort:${sortField}:${sortOrder}`
      : "";
    const cacheKey = `${CONTRACTORS_CACHE_NAMESPACE}:v${version}${paginationSuffix}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const filter: Record<string, any> = {};
    if (search.length > 0) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }
    if (status.length > 0) {
      filter.status = status;
    }
    if (company.length > 0) {
      filter.company = company;
    }

    let query = ContractorModel.find(filter)
      .populate("siteAssignments.site", "name")
      .sort({ [sortField]: sortOrder as 1 | -1 });
    if (isPaginated) {
      query = query.skip((page - 1) * limit).limit(limit);
    }
    const contractors = await query.lean();

    let responseBody: unknown = contractors;

    if (isPaginated) {
      const total = await ContractorModel.countDocuments(filter);
      responseBody = {
        contractors,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      };
    }

    await cacheSet(cacheKey, responseBody, CONTRACTORS_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const updateContractor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { id } = req.params;
    const { name, email, phone, company, status } = req.body;

    // Check if contractor exists
    const contractor = await ContractorModel.findById(id);
    if (!contractor) {
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);
    }

    // If email is being changed, check for uniqueness
    if (email && email !== contractor.email) {
      const existingContractor = await ContractorModel.findOne({ email });
      if (existingContractor) {
        throw new ApiError(
          "Email already in use by another contractor",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Update fields
    if (name) contractor.name = name;
    if (email) contractor.email = email;
    if (phone !== undefined) contractor.phone = phone;
    if (company !== undefined) contractor.company = company;
    if (status) contractor.status = status;

    await contractor.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "contractor",
      resourceId: contractor._id,
      details: `Updated contractor: ${contractor.name}`,
    });

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.OK).json({
      message: "Contractor updated successfully",
      contractor: {
        id: contractor._id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        company: contractor.company,
        status: contractor.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteContractor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { id } = req.params;

    const contractor = await ContractorModel.findById(id);
    if (!contractor) {
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);
    }

    // Optional: Prevent deletion if contractor has active site assignments or transactions
    if (contractor.siteAssignments && contractor.siteAssignments.length > 0) {
      throw new ApiError(
        "Cannot delete contractor with active site assignments. Please remove assignments first.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await ContractorTransactionModel.deleteMany({ contractor: id });
    await contractor.deleteOne();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "contractor",
      resourceId: id,
      details: `Deleted contractor: ${contractor.name}`,
    });

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.OK).json({
      message: "Contractor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const assignSiteToContractor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { contractorId, siteId } = req.body;
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const siteExists = await SiteModel.findById(siteId);
    if (!siteExists) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    if (
      contractor.siteAssignments.some(
        (assignment) => assignment.site?.toString() === siteId,
      )
    ) {
      throw new ApiError(
        "Site already assigned to contractor",
        HttpStatus.BAD_REQUEST,
      );
    }

    contractor.siteAssignments.push({ site: siteId, totalAmount: 0 });
    await contractor.save();

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res
      .status(HttpStatus.OK)
      .json({ message: "Site assigned to contractor successfully" });
  } catch (error) {
    next(error);
  }
};

const addTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { contractorId, siteId, type, amount, description, category, date } =
      req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== "admin" && userRole !== "siteManager") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    // Find or create site assignment
    let siteAssignment = contractor.siteAssignments.find(
      (assignment) => assignment.site?.toString() === siteId,
    );
    if (!siteAssignment) {
      contractor.siteAssignments.push({
        site: new Types.ObjectId(siteId),
        totalAmount: 0,
      });
      siteAssignment =
        contractor.siteAssignments[contractor.siteAssignments.length - 1];
    }

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ApiError("Invalid amount", HttpStatus.BAD_REQUEST);
    }

    // Parse date with fallback
    let transactionDate: Date;
    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        transactionDate = new Date();
      } else {
        const now = new Date();
        const isToday =
          parsed.toISOString().slice(0, 10) === now.toISOString().slice(0, 10) ||
          parsed.toDateString() === now.toDateString();
        if (isToday) {
          transactionDate = now;
        } else {
          parsed.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds(),
          );
          transactionDate = parsed;
        }
      }
    } else {
      transactionDate = new Date();
    }

    // Create transaction record
    const transaction = new ContractorTransactionModel({
      contractor: contractorId,
      site: siteId,
      type,
      amount: numAmount,
      description: description || "",
      category: category || "",
      date: transactionDate,
      addedBy: userId,
    });
    await transaction.save();

    // Update contractor balance
    siteAssignment.totalAmount += numAmount;
    await contractor.save();

    const populatedContractor = await ContractorModel.findById(contractorId)
      .populate("siteAssignments.site", "name")
      .lean();

    // --- EXPENSE RECORDING & SOURCE DEDUCTION ---
    // 1. Update site expenses
    site.expenses += numAmount;
    site.transactions.push({
      date: transactionDate,
      amount: numAmount,
      type: "contractor_payment",
      description: `${type} to contractor ${contractor.name} for ${category || "uncategorized"}`,
      relatedId: transaction._id,
      user: new Types.ObjectId(userId),
    });
    await site.save();

    // 2. Deduct from source (company or siteManager)
    if (userRole === "admin") {
      const company = await CompanyModel.findOne();
      if (!company)
        throw new ApiError(
          "Company not found",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      company.totalAmount -= numAmount;
      company.transactions.push({
        date: transactionDate,
        amount: -numAmount,
        type: "expenditure",
        description: `Contractor payment (${type}) at site ${site.name} - ${contractor.name}`,
        site: site._id,
      });
      await company.save();
    } else if (userRole === "siteManager") {
      const siteManager = await UserModel.findById(userId);
      if (!siteManager)
        throw new ApiError(
          "Site manager not found",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      siteManager.siteExpensesBalance -= numAmount;
      siteManager.siteExpensesTransactions.push({
        date: transactionDate,
        amount: -numAmount,
        type: "expenditure",
        description: `Contractor payment (${type}) at site ${site.name} - ${contractor.name}`,
        site: site._id,
        givenBy: userId ? new Types.ObjectId(userId) : undefined,
      });
      await siteManager.save();
    }

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.CREATED).json({
      message: "Transaction added successfully",
      transaction: {
        ...transaction.toObject(),
        date: transaction.date || (transaction as any).createdAt || transactionDate,
      },
      updatedContractor: populatedContractor,
    });
  } catch (error) {
    next(error);
  }
};

const getContractorTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { contractorId, siteId } = req.query;
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const transactions = await ContractorTransactionModel.find({
      contractor: contractorId,
      site: siteId,
    })
      .populate("site", "name")
      .populate("addedBy", "name")
      .sort({ date: -1, createdAt: -1 });

    const safeTransactions = transactions.map((t) => {
      const doc = t.toObject ? t.toObject() : t;
      return {
        ...doc,
        date: doc.date || doc.createdAt || new Date(),
      };
    });

    res.status(HttpStatus.OK).json(safeTransactions);
  } catch (error) {
    next(error);
  }
};

const unassignSiteFromContractor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { contractorId, siteId } = req.params;
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    if (!Types.ObjectId.isValid(contractorId) || !Types.ObjectId.isValid(siteId)) {
      throw new ApiError("Invalid contractor ID or site ID", HttpStatus.BAD_REQUEST);
    }

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const assignmentIndex = contractor.siteAssignments.findIndex(
      (assignment) => assignment.site?.toString() === siteId,
    );
    if (assignmentIndex === -1) {
      throw new ApiError(
        "Site not assigned to this contractor",
        HttpStatus.BAD_REQUEST,
      );
    }

    const assignedTotal =
      Number(contractor.siteAssignments[assignmentIndex].totalAmount) || 0;

    // Find all transactions for this contractor on this site
    const transactions = await ContractorTransactionModel.find({
      contractor: contractorId,
      site: siteId,
    });

    let totalReversed = 0;
    const company = await CompanyModel.findOne();
    const siteManagersToSave = new Map<string, any>();

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      if (amount <= 0) continue;
      totalReversed += amount;

      // 1. Add reversal transaction to site.transactions
      site.transactions.push({
        date: new Date(),
        amount: -amount,
        type: "contractor_payment",
        description: `Reversal: Removed contractor ${contractor.name} from site (Deleted ${tx.type || "payment"} transaction)`,
        relatedId: tx._id,
        user: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
      });

      // 2. Reverse source deduction
      const originalAddedBy = tx.addedBy;
      const originalUser = originalAddedBy
        ? await UserModel.findById(originalAddedBy)
        : null;
      const isOriginalAdmin = !originalUser || originalUser.role === "admin";

      if (isOriginalAdmin) {
        if (company) {
          company.totalAmount += amount;
          company.transactions.push({
            date: new Date(),
            amount: amount,
            type: "reversal",
            description: `Reversal: Removed contractor ${contractor.name} from site ${site.name} (${tx.type || "payment"})`,
            site: site._id,
          });
        }
      } else if (originalUser?.role === "siteManager") {
        const smId = originalUser._id.toString();
        let sm = siteManagersToSave.get(smId);
        if (!sm) {
          sm = originalUser;
          siteManagersToSave.set(smId, sm);
        }
        sm.siteExpensesBalance = (sm.siteExpensesBalance || 0) + amount;
        sm.siteExpensesTransactions.push({
          date: new Date(),
          amount: amount,
          type: "reversal",
          description: `Reversal: Removed contractor ${contractor.name} from site ${site.name} (${tx.type || "payment"})`,
          site: site._id,
          givenBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
        });
      }
    }

    // In case there was any assigned totalAmount exceeding the transactions found (e.g. unlinked balance)
    if (assignedTotal > totalReversed) {
      const unlinkedDiff = assignedTotal - totalReversed;
      totalReversed += unlinkedDiff;
      site.transactions.push({
        date: new Date(),
        amount: -unlinkedDiff,
        type: "contractor_payment",
        description: `Reversal: Removed contractor ${contractor.name} from site (Assigned balance cleanup)`,
        user: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
      });
      if (company) {
        company.totalAmount += unlinkedDiff;
        company.transactions.push({
          date: new Date(),
          amount: unlinkedDiff,
          type: "reversal",
          description: `Reversal: Removed contractor ${contractor.name} from site ${site.name} (Assigned balance cleanup)`,
          site: site._id,
        });
      }
    }

    if (totalReversed > 0) {
      site.expenses = Math.max(0, (site.expenses || 0) - totalReversed);
      await site.save();
      if (company) await company.save();
      for (const sm of siteManagersToSave.values()) {
        await sm.save();
      }
    }

    // Delete all transaction documents for this contractor at this site
    await ContractorTransactionModel.deleteMany({
      contractor: contractorId,
      site: siteId,
    });

    // Remove the assignment
    contractor.siteAssignments.splice(assignmentIndex, 1);
    await contractor.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "contractor",
      resourceId: contractor._id,
      details: `Unassigned site ${site.name} (${siteId}) from contractor ${contractor.name} and reversed ₹${totalReversed} in expenses`,
    });

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.OK).json({
      message: "Site unassigned from contractor successfully and expenses reversed",
      contractor: {
        id: contractor._id,
        name: contractor.name,
        siteAssignments: contractor.siteAssignments,
      },
      reversedAmount: totalReversed,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!Types.ObjectId.isValid(transactionId)) {
      throw new ApiError("Invalid transaction ID", HttpStatus.BAD_REQUEST);
    }

    const transaction = await ContractorTransactionModel.findById(transactionId);
    if (!transaction) {
      throw new ApiError("Transaction not found", HttpStatus.NOT_FOUND);
    }

    // Authorization: admin or the user who added it
    if (
      userRole !== "admin" &&
      transaction.addedBy &&
      transaction.addedBy.toString() !== userId
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const contractorId =
      (transaction.contractor as any)?._id || transaction.contractor;
    const siteId = (transaction.site as any)?._id || transaction.site;

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor) {
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);
    }

    const site = siteId ? await SiteModel.findById(siteId) : null;

    const amount = Number(transaction.amount) || 0;
    const type = transaction.type || "payment";

    // 1. Reverse contractor balance on site assignment
    if (siteId) {
      const siteAssignment = contractor.siteAssignments?.find(
        (a) => a.site?.toString() === siteId.toString(),
      );
      if (siteAssignment) {
        siteAssignment.totalAmount = Math.max(
          0,
          (siteAssignment.totalAmount || 0) - amount,
        );
        await contractor.save();
      }
    }

    // 2. Reverse site expenses
    if (site) {
      site.expenses = Math.max(0, (site.expenses || 0) - amount);
      site.transactions.push({
        date: new Date(),
        amount: -amount,
        type: "contractor_payment",
        description: `Reversal: Deleted ${type} transaction for contractor ${contractor.name}`,
        relatedId: transaction._id,
        user: userId ? new Types.ObjectId(userId) : undefined,
      });
      await site.save();
    }

    // 3. Reverse source deduction
    const originalAddedBy = transaction.addedBy;
    const originalUser = originalAddedBy
      ? await UserModel.findById(originalAddedBy)
      : null;
    const isOriginalAdmin = !originalUser || originalUser.role === "admin";

    if (isOriginalAdmin) {
      const company = await CompanyModel.findOne();
      if (company) {
        company.totalAmount += amount;
        company.transactions.push({
          date: new Date(),
          amount: amount,
          type: "reversal",
          description: `Reversal: Deleted contractor payment (${type}) at site ${site?.name || "General"} - ${contractor.name}`,
          site: site?._id,
        });
        await company.save();
      }
    } else if (originalUser?.role === "siteManager") {
      originalUser.siteExpensesBalance =
        (originalUser.siteExpensesBalance || 0) + amount;
      originalUser.siteExpensesTransactions.push({
        date: new Date(),
        amount: amount,
        type: "reversal",
        description: `Reversal: Deleted contractor payment (${type}) at site ${site?.name || "General"} - ${contractor.name}`,
        site: site?._id,
        givenBy: userId ? new Types.ObjectId(userId) : undefined,
      });
      await originalUser.save();
    }

    // 4. Delete the transaction record
    await ContractorTransactionModel.findByIdAndDelete(transactionId);

    await ActivityLogModel.create({
      user: userId,
      action: "delete",
      resource: "contractor_transaction",
      resourceId: transaction._id,
      details: `Deleted and reversed contractor transaction: ₹${amount} (${type}) for contractor ${contractor.name} at site ${site?.name || "General"}`,
    });

    const populatedContractor = await ContractorModel.findById(contractor._id)
      .populate("siteAssignments.site", "name")
      .lean();

    await bumpCacheVersion(CONTRACTORS_CACHE_NAMESPACE);

    res.status(HttpStatus.OK).json({
      message: "Transaction deleted and reversed",
      updatedContractor: populatedContractor,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createContractor,
  getAllContractors,
  updateContractor,
  deleteContractor,
  addTransaction,
  getContractorTransactions,
  assignSiteToContractor,
  unassignSiteFromContractor,
  deleteTransaction,
};