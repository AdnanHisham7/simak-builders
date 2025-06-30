import { Request, Response, NextFunction } from "express";
import { UserModel } from "@models/User";
import { UserRole } from "@entities/user";
// import { SiteModel } from "@models/Site";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import * as authService from "../services/authService";
import * as emailService from "../services/emailService";
import { SiteModel } from "@models/Site";
import bcrypt from "bcryptjs";
import { sendInitialPasswordEmail } from "services/emailService";
import { CompanyModel } from "@models/Company";
import { ActivityLogModel } from "@models/ActivityLog";

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
    const users = await UserModel.find({ role }).populate("assignedSites");
    // Map to the expected response format
    const response = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isBlocked: user.isBlocked,
      role: user.role,
      assignedSites:
        user.assignedSites?.map((site: any) => ({
          id: site._id,
          name: site.name,
        })) || [],
      password: user.password,
      siteExpensesBalance: user.siteExpensesBalance,
    }));

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
        user.refreshToken = null; // Invalidate refresh token
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
    const { amount, isVerified = false } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }
    // if (req.user.role !== "admin") {
    //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    // }
    const salaryAssignment: any = {
      date: new Date(),
      givenBy: req.user?.userId,
      amount,
      isVerified,
    };
    if (isVerified) {
      user.totalSalary += amount;
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
    user.totalSalary += salaryAssignment.amount;
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
      "name email role salaryAssignments totalSalary fixedSalary" // Added fixedSalary
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
    const { amount } = req.body;
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
    salaryAssignment.amount = amount;
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
  assignSitesToArchitect,
  assignSalary,
  verifySalaryAssignment,
  listSalaries,
  updateFixedSalary,
  updateSalaryAssignmentAmount,
  assignSiteExpenses,
  getCurrentUser,
  assignSitesToClients,
  getUnassignedClients,
};
