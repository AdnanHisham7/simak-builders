import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ContractorModel } from "@models/Contractor";
import { ContractorTransactionModel } from "@models/ContractorTransaction";
import { ActivityLogModel } from "@models/ActivityLog";
import { Types } from "mongoose";

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

    contractor.siteAssignments.push({ site: siteId, balance: 0 });
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
    const { contractorId, siteId, type, amount, description } = req.body;
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const siteExists = await SiteModel.findById(siteId);
    if (!siteExists) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    let siteAssignment = contractor.siteAssignments.find(
      (assignment) => assignment.site?.toString() === siteId,
    );
    if (!siteAssignment) {
      // Automatically assign the site if not already assigned
      siteAssignment = contractor.siteAssignments.create({
        site: new Types.ObjectId(siteId),
        balance: 0,
      });

      contractor.siteAssignments.push(siteAssignment);
    }

    const transaction = new ContractorTransactionModel({
      contractor: contractorId,
      site: siteId,
      type,
      amount,
      description,
      createdBy: req.user.userId,
    });
    await transaction.save();

    // Update balance based on transaction type
    if (type === "advance" || type === "additional_payment") {
      siteAssignment.balance += amount;
    } else if (type === "expense") {
      siteAssignment.balance -= amount;
    }
    await contractor.save();

    res.status(HttpStatus.CREATED).json({
      message: "Transaction added successfully",
      transaction,
      updatedContractor: {
        ...contractor.toObject(),
        siteAssignments: contractor.siteAssignments.map((assignment) => ({
          site: assignment.site,
          balance: assignment.balance,
        })),
      },
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
    console.log("HAHAHAHAHAHA", siteId, contractorId);
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    console.log("HAHAHAHAHAHA MAATHRA");
    const contractor = await ContractorModel.findById(contractorId);
    if (!contractor)
      throw new ApiError("Contractor not found", HttpStatus.NOT_FOUND);

    const transactions = await ContractorTransactionModel.find({
      contractor: contractorId,
      site: siteId,
    })
      .populate("site", "name")
      .populate("createdBy", "name");
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

export default {
  createContractor,
  getAllContractors,
  updateContractor,
  deleteContractor,
  addTransaction,
  getContractorTransactions,
  assignSiteToContractor,
  unassignSiteFromContractor,
};
