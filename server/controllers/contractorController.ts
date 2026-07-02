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
    const contractors = await ContractorModel.find({}).populate(
      "siteAssignments.site",
      "name",
    );
    res.status(HttpStatus.OK).json(contractors);
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
    const { contractorId, siteId, type, amount, description, category } =
      req.body;
    console.log(
      "HAHAHAHAHA",
      contractorId,
      siteId,
      type,
      amount,
      description,
      category,
    );
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

    // Create transaction record
    const transaction = new ContractorTransactionModel({
      contractor: contractorId,
      site: siteId,
      type,
      amount: numAmount,
      description: description || "",
      category: category || "",
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
      date: new Date(),
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
        date: new Date(),
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
        date: new Date(),
        amount: -numAmount,
        type: "expenditure",
        description: `Contractor payment (${type}) at site ${site.name} - ${contractor.name}`,
        site: site._id,
        givenBy: userId ? new Types.ObjectId(userId) : undefined,
      });
      await siteManager.save();
    }

    res.status(HttpStatus.CREATED).json({
      message: "Transaction added successfully",
      transaction,
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
      .populate("addedBy", "name");
    res.status(HttpStatus.OK).json(transactions);
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

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const siteExists = await SiteModel.findById(siteId);
    if (!siteExists) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const assignmentIndex = contractor.siteAssignments.findIndex(
      (assignment) => assignment.site?.toString() === siteId,
    );
    if (assignmentIndex === -1) {
      throw new ApiError(
        "Site not assigned to this contractor",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Remove the assignment
    contractor.siteAssignments.splice(assignmentIndex, 1);
    await contractor.save();

    // Optionally, delete all transactions for this contractor+site if you want
    // await ContractorTransactionModel.deleteMany({ contractor: contractorId, site: siteId });

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "contractor",
      resourceId: contractor._id,
      details: `Unassigned site ${siteId} from contractor ${contractor.name}`,
    });

    res.status(HttpStatus.OK).json({
      message: "Site unassigned from contractor successfully",
      contractor: {
        id: contractor._id,
        name: contractor.name,
        siteAssignments: contractor.siteAssignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// const getContractorById = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     if (req.user?.role !== "admin")
//       throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     const contractorId = req.params.id;
//     const contractor = await ContractorModel.findById(contractorId).populate(
//       "siteAssignments.site",
//       "name"
//     );
//     if (!contractor)
//       throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);
//     res.status(HttpStatus.OK).json(contractor);
//   } catch (error) {
//     next(error);
//   }
// };

const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const transaction = await ContractorTransactionModel.findById(transactionId)
      .populate("contractor")
      .populate("site");
    
    console.log("Deleting transaction:", transaction?.site);
    if (!transaction) {
      throw new ApiError("Transaction not found", HttpStatus.NOT_FOUND);
    }

    // Authorization: admin or the user who added it
    if (userRole !== "admin" && transaction.addedBy.toString() !== userId) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const contractor = await ContractorModel.findById(transaction.contractor);
    const site = await SiteModel.findById(transaction.site);
    if (!contractor || !site) {
      throw new ApiError(
        "Associated contractor or site not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const amount = transaction.amount;
    const type = transaction.type;

    // 1. Reverse contractor balance
    const transactionSiteId =
      typeof transaction.site === "object" &&
      transaction.site !== null &&
      "_id" in transaction.site
        ? (transaction.site as { _id?: Types.ObjectId })._id?.toString()
        : transaction.site?.toString();

    const siteAssignment = contractor.siteAssignments.find(
      (a) => a.site?.toString() === transactionSiteId,
    );
    console.log("HAHAHA", siteAssignment, contractor.siteAssignments);
    if (siteAssignment) {
      siteAssignment.totalAmount -= amount;
      await contractor.save();
    }

    // 2. Reverse site expenses
    site.expenses -= amount;
    site.transactions.push({
      date: new Date(),
      amount: -amount,
      type: "contractor_payment",
      description: `Reversal: Deleted ${type} transaction for contractor ${contractor.name}`,
      relatedId: transaction._id,
      user: new Types.ObjectId(userId),
    });
    await site.save();

    // 3. Reverse source deduction
    const originalAddedBy = transaction.addedBy;
    const originalUser = await UserModel.findById(originalAddedBy);
    if (originalUser?.role === "admin") {
      const company = await CompanyModel.findOne();
      if (company) {
        company.totalAmount += amount;
        company.transactions.push({
          date: new Date(),
          amount: amount,
          type: "reversal",
          description: `Reversal: Deleted contractor payment (${type}) at site ${site.name}`,
          site: site._id,
        });
        await company.save();
      }
    } else if (originalUser?.role === "siteManager") {
      const siteManager = await UserModel.findById(originalAddedBy);
      if (siteManager) {
        siteManager.siteExpensesBalance += amount;
        siteManager.siteExpensesTransactions.push({
          date: new Date(),
          amount: amount,
          type: "reversal",
          description: `Reversal: Deleted contractor payment (${type}) at site ${site.name}`,
          site: site._id,
          givenBy: userId ? new Types.ObjectId(userId) : undefined,
        });
        await siteManager.save();
      }
    }

    // 4. Delete the transaction record
    await ContractorTransactionModel.findByIdAndDelete(transactionId);

    const populatedContractor = await ContractorModel.findById(
      contractor._id,
    )
      .populate("siteAssignments.site", "name")
      .lean();

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