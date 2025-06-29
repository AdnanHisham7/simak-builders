import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ContractorModel } from "@models/Contractor";
import { ContractorTransactionModel } from "@models/ContractorTransaction";
import { ActivityLogModel } from "@models/ActivityLog";

const createContractor = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    const contractors = await ContractorModel.find({}).populate(
      "siteAssignments.site",
      "name"
    );
    res.status(HttpStatus.OK).json(contractors);
  } catch (error) {
    next(error);
  }
};

const assignSiteToContractor = async (
  req: Request,
  res: Response,
  next: NextFunction
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
        (assignment) => assignment.site.toString() === siteId
      )
    ) {
      throw new ApiError(
        "Site already assigned to contractor",
        HttpStatus.BAD_REQUEST
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
  next: NextFunction
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
      (assignment) => assignment.site.toString() === siteId
    );
    if (!siteAssignment) {
      // Automatically assign the site if not already assigned
      siteAssignment = { site: siteId, balance: 0 };
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
  next: NextFunction
) => {
  try {
    const { contractorId, siteId } = req.query;
    console.log("HAHAHAHAHAHA", siteId, contractorId)
    if (req.user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    
    console.log("HAHAHAHAHAHA MAATHRA")
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


export default { createContractor, getAllContractors, addTransaction, getContractorTransactions, assignSiteToContractor }