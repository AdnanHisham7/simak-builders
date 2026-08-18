import { Request, Response, NextFunction } from "express";
import { UserModel } from "@models/User";
import { UserRole } from "@entities/user";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import * as authService from "../services/authService";
import * as emailService from "../services/emailService";
import { SiteModel } from "@models/Site";
import bcrypt from "bcryptjs";
import { sendInitialPasswordEmail } from "../services/emailService";
import { CompanyModel } from "@models/Company";
import { ActivityLogModel } from "@models/ActivityLog";
import { Types } from "mongoose";
import { cacheGet, cacheSet } from "@config/redis";

const USERS_BY_ROLE_CACHE_TTL_SECONDS = 20;

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const companyAdmin = req.userId;
    // if (companyAdmin.role !== UserRole.CompanyAdmin) {
    //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    // }

    const users = await UserModel.find({});
    res.status(HttpStatus.OK).json(users);
  } catch (error) {
    next(error);
  }
};

const getUsersByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.query;
    const user = req.user;
    // console.log(user, role)
    // // Authorization check: Only CompanyAdmin can access this endpoint
    // if (user?.role !== UserRole.CompanyAdmin) {
    //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    // }

    if (
      !role ||
      typeof role !== "string" ||
      !Object.values(UserRole).includes(role as UserRole)
    ) {
      throw new ApiError(
        "Invalid or missing role parameter",
        HttpStatus.BAD_REQUEST
      );
    }
    // console.log("allUsers",allUsers)
    // Fetch users with the specified role, selecting only necessary fields
    const includeDeleted = req.query.includeDeleted === "true";
    const query: Record<string, any> = { role };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    const cacheKey = `users:role:${role}:${includeDeleted ? "withDeleted" : "active"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const users = await UserModel.find(query)
      .populate("assignedSites", "name")
      .lean();
    // Map to the expected response format
    const response = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isBlocked: user.isBlocked,
      isDeleted: user.isDeleted || false,
      role: user.role,
      profileImage: user.profileImage,
      assignedSites:
        user.assignedSites?.map((site: any) => ({
          id: site._id,
          name: site.name,
        })) || [],
      password: user.password,
      siteExpensesBalance: user.siteExpensesBalance,
    }));

    await cacheSet(cacheKey, response, USERS_BY_ROLE_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    if (typeof isBlocked !== "undefined") {
      user.isBlocked = isBlocked;
      if (isBlocked) {
        user.sessions = [] as any; // Invalidate all active sessions
      }
    }
    await user.save();
    res.status(HttpStatus.OK).json({
      message: "User updated successfully",
      updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
    });
  } catch (error) {
    next(error);
  }
};

const regeneratePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const newPassword = Math.random().toString(36).slice(-8); // Generate random password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash with bcrypt
    user.password = hashedPassword; // Store hashed password
    await user.save();

    // Send the plain password via email
    await emailService.sendRegeneratedPasswordEmail(user.email, newPassword);

    // Return response with the plain password
    res.status(HttpStatus.OK).json({
      message: "Password regenerated",
      newPassword: newPassword,
    });
  } catch (error) {
    next(error);
  }
};

const createSiteManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, role, assignedSites } = req.body;
    if (role !== "siteManager") {
      throw new ApiError("Invalid role", HttpStatus.BAD_REQUEST);
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
    }

    // Verify assigned sites exist if provided
    if (assignedSites?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: assignedSites },
      });
      if (existingSites !== assignedSites.length) {
        throw new ApiError(
          "One or more assigned sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
      assignedSites: assignedSites || [],
      isEmailVerified: true,
    });
    await user.save();

    if (assignedSites?.length) {
      await SiteModel.updateMany(
        { _id: { $in: assignedSites } },
        { $push: { siteManagers: user._id } }
      );
    }

    await sendInitialPasswordEmail(email, password);

    res.status(HttpStatus.CREATED).json({
      message: "Site manager created successfully",
      user: {
        id: user._id,
        name,
        email,
        isBlocked: user.isBlocked,
        assignedSites,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSiteManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, isBlocked } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "siteManager") {
      throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
    }

    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

    await user.save();
    res.status(HttpStatus.OK).json({
      message: "Site manager updated successfully",
      updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
    });
  } catch (error) {
    next(error);
  }
};

const createSupervisor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, role, assignedSites } = req.body;
    if (role !== "supervisor") {
      throw new ApiError("Invalid role", HttpStatus.BAD_REQUEST);
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
    }
    if (assignedSites?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: assignedSites },
      });
      if (existingSites !== assignedSites.length) {
        throw new ApiError(
          "One or more assigned sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
      assignedSites: assignedSites || [],
      isEmailVerified: true,
    });
    await user.save();
    if (assignedSites?.length) {
      await SiteModel.updateMany(
        { _id: { $in: assignedSites } },
        { $push: { siteManagers: user._id } } // Assuming supervisors are added to siteManagers for simplicity
      );
    }
    await sendInitialPasswordEmail(email, password);
    res.status(HttpStatus.CREATED).json({
      message: "Supervisor created successfully",
      user: {
        id: user._id,
        name,
        email,
        isBlocked: user.isBlocked,
        assignedSites,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSupervisor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, isBlocked } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "supervisor") {
      throw new ApiError("Supervisor not found", HttpStatus.NOT_FOUND);
    }
    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
      }
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;
    await user.save();
    res.status(HttpStatus.OK).json({
      message: "Supervisor updated successfully",
      updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
    });
  } catch (error) {
    next(error);
  }
};

// Append to userController.ts
const createArchitect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, assignedSites } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already in use", HttpStatus.CONFLICT);
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: "architect",
      assignedSites: assignedSites || [],
      isEmailVerified: true,
    });
    await user.save();

    if (assignedSites?.length) {
      await SiteModel.updateMany(
        { _id: { $in: assignedSites } },
        { $push: { architects: user._id } }
      );
    }

    await sendInitialPasswordEmail(email, password);

    res.status(HttpStatus.CREATED).json({
      message: "Architect created successfully",
      user: {
        id: user._id,
        name,
        email,
        isBlocked: user.isBlocked,
        assignedSites,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateArchitect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, isBlocked } = req.body;

    const user = await UserModel.findById(id);
    if (!user || user.role !== "architect") {
      throw new ApiError("Architect not found", HttpStatus.NOT_FOUND);
    }

    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

    await user.save();
    res.status(HttpStatus.OK).json({
      message: "Architect updated successfully",
      updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
    });
  } catch (error) {
    next(error);
  }
};

const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new ApiError("Missing required fields", HttpStatus.BAD_REQUEST);
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
    }

    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: "client",
      assignedSites: [], // Empty array for clients
      isEmailVerified: true,
    });
    await user.save();

    await sendInitialPasswordEmail(email, password);

    res.status(HttpStatus.CREATED).json({
      message: "Client created successfully",
      user: {
        id: user._id.toString(),
        name,
        email,
        isBlocked: user.isBlocked,
        assignedSite: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, isBlocked } = req.body;

    const user = await UserModel.findById(id);
    if (!user || user.role !== "client") {
      throw new ApiError("Client not found", HttpStatus.NOT_FOUND);
    }
    if (user.isDeleted) {
      throw new ApiError(
        "This client has been deleted. Restore it first to make changes.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

    await user.save();

    res.status(HttpStatus.OK).json({
      message: "Client updated successfully",
      updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
    });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "client") {
      throw new ApiError("Client not found", HttpStatus.NOT_FOUND);
    }
    if (user.isDeleted) {
      throw new ApiError("Client is already deleted", HttpStatus.BAD_REQUEST);
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.sessions = [] as any;
    await user.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: "client",
      resourceId: user._id,
      details: `Soft-deleted client: ${user.name}`,
    });

    res.status(HttpStatus.OK).json({ message: "Client deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const restoreClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "client") {
      throw new ApiError("Client not found", HttpStatus.NOT_FOUND);
    }
    if (!user.isDeleted) {
      throw new ApiError("Client is not deleted", HttpStatus.BAD_REQUEST);
    }

    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "client",
      resourceId: user._id,
      details: `Restored client: ${user.name}`,
    });

    res.status(HttpStatus.OK).json({ message: "Client restored successfully" });
  } catch (error) {
    next(error);
  }
};

const DELETABLE_STAFF_ROLES = [
  UserRole.Architect,
  UserRole.SiteManager,
  UserRole.Supervisor,
  UserRole.Employee,
];

const deleteStaffMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user || !DELETABLE_STAFF_ROLES.includes(user.role)) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    if (user.isDeleted) {
      throw new ApiError("This user is already deleted", HttpStatus.BAD_REQUEST);
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.sessions = [] as any;
    await user.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "delete",
      resource: user.role,
      resourceId: user._id,
      details: `Soft-deleted ${user.role}: ${user.name}`,
    });

    res.status(HttpStatus.OK).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const restoreStaffMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user || !DELETABLE_STAFF_ROLES.includes(user.role)) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    if (!user.isDeleted) {
      throw new ApiError("This user is not deleted", HttpStatus.BAD_REQUEST);
    }

    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: user.role,
      resourceId: user._id,
      details: `Restored ${user.role}: ${user.name}`,
    });

    res.status(HttpStatus.OK).json({ message: "User restored successfully" });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, assignedSites } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      throw new ApiError("Email already in use", HttpStatus.CONFLICT);

    const tempPassword = authService.generateTempPassword();
    const hashedPassword = await authService.hashPassword(tempPassword);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
      assignedSites:
        !assignedSites || role === "companyAdmin" || role === "supervisor"
          ? []
          : assignedSites,
      isEmailVerified: true,
    });
    await user.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "user",
      resourceId: user._id,
      details: `Created user: ${user.name}`,
    });

    if (role === "client" && assignedSites?.length) {
      await SiteModel.findByIdAndUpdate(assignedSites[0], { client: user._id });
    }

    res
      .status(HttpStatus.CREATED)
      .json({ message: "User created", userId: user._id });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, name, assignedSites, isBlocked, enabledFunctionalities } =
      req.body;
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError("User not found", HttpStatus.NOT_FOUND);

    const previousSites = user.assignedSites.map((id) => id.toString());
    if (name) user.name = name;
    if (assignedSites && !["companyAdmin", "supervisor"].includes(user.role)) {
      user.assignedSites = assignedSites;
      if (user.role === "client") {
        const removedSites = previousSites.filter(
          (id) => !assignedSites.includes(id)
        );
        await SiteModel.updateMany(
          { _id: { $in: removedSites }, client: userId },
          { $unset: { client: "" } }
        );
        if (assignedSites.length) {
          await SiteModel.findByIdAndUpdate(assignedSites[0], {
            client: userId,
          });
        }
      }
    }
    if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;
    if (enabledFunctionalities)
      user.enabledFunctionalities = enabledFunctionalities;
    await user.save();
    res.status(HttpStatus.OK).json({ message: "User updated" });
  } catch (error) {
    next(error);
  }
};

const assignSitesToSupervisor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { siteIds } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "supervisor") {
      throw new ApiError("Supervisor not found", HttpStatus.NOT_FOUND);
    }
    if (siteIds?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: siteIds },
      });
      if (existingSites !== siteIds.length) {
        throw new ApiError(
          "One or more sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    user.assignedSites = siteIds || [];
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Sites assigned successfully", assignedSites: siteIds });
  } catch (error) {
    next(error);
  }
};

const assignSitesToManager = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { siteIds } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "siteManager") {
      throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
    }
    if (siteIds?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: siteIds },
      });
      if (existingSites !== siteIds.length) {
        throw new ApiError(
          "One or more sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    user.assignedSites = siteIds || [];
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Sites assigned successfully", assignedSites: siteIds });
  } catch (error) {
    next(error);
  }
};

const assignSitesToClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { siteIds } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "client") {
      throw new ApiError("Client not found", HttpStatus.NOT_FOUND);
    }
    if (siteIds?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: siteIds },
      });
      if (existingSites !== siteIds.length) {
        throw new ApiError(
          "One or more sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    user.assignedSites = siteIds || [];
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Sites assigned successfully", assignedSites: siteIds });
  } catch (error) {
    next(error);
  }
};

const assignSitesToArchitect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { siteIds } = req.body;
    const user = await UserModel.findById(id);
    if (!user || user.role !== "architect") {
      throw new ApiError("Architect not found", HttpStatus.NOT_FOUND);
    }
    if (siteIds?.length) {
      const existingSites = await SiteModel.countDocuments({
        _id: { $in: siteIds },
      });
      if (existingSites !== siteIds.length) {
        throw new ApiError(
          "One or more sites do not exist",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    user.assignedSites = siteIds || [];
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Sites assigned successfully", assignedSites: siteIds });
  } catch (error) {
    next(error);
  }
};

const assignSalary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      amount,
      allowance = 0,
      notes = "",
      date,
      isVerified = false,
    } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const numAmount = Number(amount);
    const numAllowance = Number(allowance) || 0;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ApiError("Amount must be greater than zero", HttpStatus.BAD_REQUEST);
    }
    if (numAllowance < 0) {
      throw new ApiError("Allowance cannot be negative", HttpStatus.BAD_REQUEST);
    }

    const assignmentDate = date ? new Date(date) : new Date();
    if (isNaN(assignmentDate.getTime())) {
      throw new ApiError("Invalid date", HttpStatus.BAD_REQUEST);
    }

    const salaryAssignment: any = {
      date: assignmentDate,
      givenBy: req.user?.userId,
      amount: numAmount,
      allowance: numAllowance,
      notes: String(notes).trim(),
      isVerified: Boolean(isVerified),
    };
    if (salaryAssignment.isVerified) {
      user.totalSalary += numAmount + numAllowance;
    }
    user.salaryAssignments.push(salaryAssignment);
    await user.save();
    res
      .status(HttpStatus.CREATED)
      .json({ message: "Salary assigned successfully", salaryAssignment });
  } catch (error) {
    next(error);
  }
};

const verifySalaryAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, assignmentId } = req.params;
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    // if (req.user.role !== "admin") {
    //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    // }
    const salaryAssignment = user.salaryAssignments.find(
      (sa) => sa._id?.toString() === assignmentId.toString()
    );

    if (!salaryAssignment) {
      throw new ApiError("Salary assignment not found", HttpStatus.NOT_FOUND);
    }
    if (salaryAssignment.isVerified) {
      throw new ApiError(
        "Salary assignment already verified",
        HttpStatus.BAD_REQUEST
      );
    }
    salaryAssignment.isVerified = true;
    user.totalSalary += salaryAssignment.amount + (salaryAssignment.allowance || 0);
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Salary assignment verified successfully" });
  } catch (error) {
    next(error);
  }
};

const listSalaries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allowedRoles = ["siteManager", "supervisor", "architect"];
    const users = await UserModel.find(
      { role: { $in: allowedRoles } },
      "name email role salaryAssignments totalSalary fixedSalary profileImage" // Added fixedSalary
    ).populate("salaryAssignments.givenBy", "name");
    res.status(HttpStatus.OK).json(users);
  } catch (error) {
    next(error);
  }
};

const updateFixedSalary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { fixedSalary } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    user.fixedSalary = fixedSalary;
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Fixed salary updated successfully" });
  } catch (error) {
    next(error);
  }
};

const updateSalaryAssignmentAmount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, assignmentId } = req.params;
    const { amount, allowance, notes } = req.body;
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    const salaryAssignment = user.salaryAssignments.find(
      (sa) => sa._id?.toString() === assignmentId.toString()
    );
    if (!salaryAssignment) {
      throw new ApiError("Salary assignment not found", HttpStatus.NOT_FOUND);
    }
    if (salaryAssignment.isVerified) {
      throw new ApiError(
        "Cannot update verified salary assignment",
        HttpStatus.BAD_REQUEST
      );
    }
    if (amount !== undefined) salaryAssignment.amount = amount;
    if (allowance !== undefined) salaryAssignment.allowance = allowance;
    if (notes !== undefined) salaryAssignment.notes = notes;
    await user.save();
    res
      .status(HttpStatus.OK)
      .json({ message: "Salary assignment updated successfully" });
  } catch (error) {
    next(error);
  }
};

const assignSiteExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const user = await UserModel.findById(id);
    console.log(id, user, amount);
    if (!user || user.role !== "siteManager") {
      throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
    }
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (company.totalAmount < amount) {
      throw new ApiError("Insufficient company funds", HttpStatus.BAD_REQUEST);
    }
    if (amount <= 0) {
      throw new ApiError("Amount must be positive", HttpStatus.BAD_REQUEST);
    }
    const transaction: any = {
      date: new Date(),
      amount,
      type: "incoming",
      givenBy: req.user?.userId,
      description: "Assigned by admin for site expenses",
    };
    user.siteExpensesTransactions.push(transaction);
    user.siteExpensesBalance += amount;
    await user.save();
    company.totalAmount -= amount;
    await company.save();
    res
      .status(HttpStatus.CREATED)
      .json({ message: "Site expenses assigned successfully", transaction });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.user?.userId)
      .select(
        "-password -twoFactorSecret -resetToken -verificationToken -refreshToken"
      )
      .populate("assignedSites")
      .populate("salaryAssignments.givenBy", "name")
      .populate("siteExpensesTransactions.givenBy", "name")
      .populate("siteExpensesTransactions.site", "name");
    if (!user) throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    res.status(HttpStatus.OK).json(user);
  } catch (error) {
    next(error);
  }
};

const MAX_PROFILE_NAME_LENGTH = 100;
const MAX_PROFILE_PHONE_LENGTH = 20;

const updateOwnProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const { name, phone } = req.body;
    const updatedFields: string[] = [];

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        throw new ApiError("Name cannot be empty", HttpStatus.BAD_REQUEST);
      }
      if (trimmedName.length > MAX_PROFILE_NAME_LENGTH) {
        throw new ApiError(
          `Name cannot exceed ${MAX_PROFILE_NAME_LENGTH} characters`,
          HttpStatus.BAD_REQUEST
        );
      }
      user.name = trimmedName;
      updatedFields.push("name");
    }

    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (trimmedPhone.length > MAX_PROFILE_PHONE_LENGTH) {
        throw new ApiError(
          `Phone number cannot exceed ${MAX_PROFILE_PHONE_LENGTH} characters`,
          HttpStatus.BAD_REQUEST
        );
      }
      user.phone = trimmedPhone;
      updatedFields.push("phone");
    }

    if (req.file) {
      user.profileImage = req.file.path;
      updatedFields.push("profileImage");
    }

    if (updatedFields.length === 0) {
      throw new ApiError("No updatable fields provided", HttpStatus.BAD_REQUEST);
    }

    await user.save();

    await ActivityLogModel.create({
      user: userId,
      action: "update",
      resource: "profile",
      resourceId: user._id,
      details: `Updated own profile fields: ${updatedFields.join(", ")}`,
    });

    const sanitizedUser = user.toObject();
    delete (sanitizedUser as any).password;
    delete (sanitizedUser as any).twoFactorSecret;
    delete (sanitizedUser as any).resetToken;
    delete (sanitizedUser as any).verificationToken;
    delete (sanitizedUser as any).refreshToken;
    delete (sanitizedUser as any).sessions;

    res.status(HttpStatus.OK).json({
      message: "Profile updated successfully",
      user: sanitizedUser,
      updatedFields,
    });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const ALLOWED_NUMBER_FORMATS = ["en-IN", "en-US", "en-GB"];

const updateOwnPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const { defaultLandingPage, dateFormat, numberFormat, timezone } = req.body;

    if (dateFormat !== undefined && !ALLOWED_DATE_FORMATS.includes(dateFormat)) {
      throw new ApiError("Invalid date format", HttpStatus.BAD_REQUEST);
    }
    if (
      numberFormat !== undefined &&
      !ALLOWED_NUMBER_FORMATS.includes(numberFormat)
    ) {
      throw new ApiError("Invalid number format", HttpStatus.BAD_REQUEST);
    }
    if (timezone !== undefined && typeof timezone !== "string") {
      throw new ApiError("Invalid timezone", HttpStatus.BAD_REQUEST);
    }
    if (
      defaultLandingPage !== undefined &&
      typeof defaultLandingPage !== "string"
    ) {
      throw new ApiError("Invalid default landing page", HttpStatus.BAD_REQUEST);
    }

    if (!user.preferences) {
      user.preferences = {
        dateFormat: "DD/MM/YYYY",
        numberFormat: "en-IN",
        timezone: "Asia/Kolkata",
      } as any;
    }

    if (defaultLandingPage !== undefined) {
      user.preferences.defaultLandingPage = defaultLandingPage;
    }
    if (dateFormat !== undefined) user.preferences.dateFormat = dateFormat;
    if (numberFormat !== undefined) user.preferences.numberFormat = numberFormat;
    if (timezone !== undefined) user.preferences.timezone = timezone;

    await user.save();

    res.status(HttpStatus.OK).json({
      message: "Preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};

const requestOwnDeactivation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    if (req.user?.role === UserRole.CompanyAdmin) {
      throw new ApiError(
        "Admin accounts cannot request self-deactivation",
        HttpStatus.FORBIDDEN
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    if (user.deactivationRequest?.status === "pending") {
      throw new ApiError(
        "A deactivation request is already pending review",
        HttpStatus.BAD_REQUEST
      );
    }

    const { reason } = req.body;
    user.deactivationRequest = {
      status: "pending",
      reason: reason ? String(reason).trim().slice(0, 500) : "",
      requestedAt: new Date(),
    } as any;
    await user.save();

    await ActivityLogModel.create({
      user: userId,
      action: "create",
      resource: "deactivation_request",
      resourceId: user._id,
      details: `User requested account deactivation`,
    });

    res.status(HttpStatus.CREATED).json({
      message: "Deactivation request submitted for admin approval",
      deactivationRequest: user.deactivationRequest,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOwnDeactivationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    if (user.deactivationRequest?.status !== "pending") {
      throw new ApiError(
        "There is no pending deactivation request to cancel",
        HttpStatus.BAD_REQUEST
      );
    }

    user.deactivationRequest = { status: "none" } as any;
    await user.save();

    res
      .status(HttpStatus.OK)
      .json({ message: "Deactivation request cancelled" });
  } catch (error) {
    next(error);
  }
};

const listDeactivationRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== UserRole.CompanyAdmin) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const users = await UserModel.find({
      "deactivationRequest.status": "pending",
    }).select("name email role deactivationRequest");

    res.status(HttpStatus.OK).json(
      users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        deactivationRequest: user.deactivationRequest,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const getPendingDeactivationCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== UserRole.CompanyAdmin) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const count = await UserModel.countDocuments({
      "deactivationRequest.status": "pending",
    });

    res.status(HttpStatus.OK).json({ count });
  } catch (error) {
    next(error);
  }
};

const reviewDeactivationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== UserRole.CompanyAdmin) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { id } = req.params;
    const { decision, notes } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      throw new ApiError(
        "decision must be 'approve' or 'reject'",
        HttpStatus.BAD_REQUEST
      );
    }

    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    if (user.deactivationRequest?.status !== "pending") {
      throw new ApiError(
        "This user has no pending deactivation request",
        HttpStatus.BAD_REQUEST
      );
    }

    if (decision === "approve") {
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.sessions = [] as any;
      user.deactivationRequest = {
        status: "approved",
        reason: user.deactivationRequest.reason,
        requestedAt: user.deactivationRequest.requestedAt,
        reviewedBy: new Types.ObjectId(req.user!.userId),
        reviewedAt: new Date(),
        reviewNotes: notes ? String(notes).trim().slice(0, 500) : "",
      } as any;
    } else {
      user.deactivationRequest = {
        status: "rejected",
        reason: user.deactivationRequest.reason,
        requestedAt: user.deactivationRequest.requestedAt,
        reviewedBy: new Types.ObjectId(req.user!.userId),
        reviewedAt: new Date(),
        reviewNotes: notes ? String(notes).trim().slice(0, 500) : "",
      } as any;
    }
    await user.save();

    await ActivityLogModel.create({
      user: req.user!.userId,
      action: "update",
      resource: "deactivation_request",
      resourceId: user._id,
      details: `Deactivation request ${decision}d for ${user.name}`,
    });

    res.status(HttpStatus.OK).json({
      message: `Deactivation request ${decision}d successfully`,
      deactivationRequest: user.deactivationRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getUnassignedClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const unassignedClients = await UserModel.find({
      role: "client",
      assignedSites: { $size: 0 }, // Matches clients with an empty assignedSites array
    }).select("name email _id"); // Return only necessary fields
    res.status(HttpStatus.OK).json(unassignedClients);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Authorization check: Only CompanyAdmin can access this endpoint
    if (requestingUser?.role !== UserRole.CompanyAdmin) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    // Fetch user by ID and populate relevant fields
    const user = await UserModel.findById(id)
      .select(
        "-password -twoFactorSecret -resetToken -verificationToken -refreshToken"
      )
      .populate("assignedSites")
      .populate("salaryAssignments.givenBy", "name")
      .populate("siteExpensesTransactions.givenBy", "name")
      .populate("siteExpensesTransactions.site", "name");

    // Check if user exists
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    // Send the user data in the response
    res.status(HttpStatus.OK).json(user);
  } catch (error) {
    next(error);
  }
};

export default {
  createUser,
  updateUser,
  getUsers,
  getUsersByRole,
  getUserById,
  toggleStatus,
  regeneratePassword,
  assignSitesToSupervisor,
  createSiteManager,
  updateSiteManager,
  assignSitesToManager,
  createSupervisor,
  updateSupervisor,
  createArchitect,
  updateArchitect,
  createClient,
  updateClient,
  deleteClient,
  restoreClient,
  deleteStaffMember,
  restoreStaffMember,
  assignSitesToArchitect,
  assignSalary,
  verifySalaryAssignment,
  listSalaries,
  updateFixedSalary,
  updateSalaryAssignmentAmount,
  assignSiteExpenses,
  getCurrentUser,
  updateOwnProfile,
  assignSitesToClients,
  getUnassignedClients,
  updateOwnPreferences,
  requestOwnDeactivation,
  cancelOwnDeactivationRequest,
  listDeactivationRequests,
  getPendingDeactivationCount,
  reviewDeactivationRequest,
};