// userSchema:
// import { Schema, model } from "mongoose";
// import { User, UserRole } from "@entities/user";

// const UserSchema = new Schema<User>(
//   {
//     name: { type: String, required: false },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     profileImage: { type: String },
//     role: { type: String, enum: Object.values(UserRole), required: true },
//     assignedSites: [{ type: Schema.Types.ObjectId, ref: "Site" }],
//     isEmailVerified: { type: Boolean, default: false },
//     verificationToken: { type: String },
//     resetToken: { type: String },
//     refreshToken: { type: String },
//     twoFactorEnabled: { type: Boolean, default: false },
//     twoFactorSecret: { type: String },
//     isKYCCompleted: { type: Boolean, default: false },
//     kycDocuments: [
//       {
//         type: { type: String, required: true },
//         url: { type: String, required: true },
//       },
//     ],
//     isBlocked: { type: Boolean, default: false },
//     isAdmin: { type: Boolean, default: false },
//     enabledFunctionalities: [{ type: String }],
//   },
//   { timestamps: true }
// );

// export const UserModel = model<User>("User", UserSchema);




// siteSchema:
// import { Schema, model } from "mongoose";
// import { Site } from "@entities/site";

// const SiteSchema = new Schema<Site>(
//   {
//     name: { type: String, required: true },
//     address: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     zip: { type: String, required: true },
//     siteManagers: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     supervisors: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     architects: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     client: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     status: { type: String, default: "Processing" },
//     phases: [
//       {
//         name: { type: String, required: true },
//         isCompleted: { type: Boolean, default: false },
//         completionDate: { type: Date },
//       },
//     ],
//     budget: { type: Number, required: true },
//     expenses: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// export const SiteModel = model<Site>("Site", SiteSchema);


// userController.ts:
// import { Request, Response, NextFunction } from "express";
// import { UserModel } from "@models/User";
// import { UserRole } from "@entities/user";
// // import { SiteModel } from "@models/Site";
// import { ApiError } from "@utils/errors/ApiError";
// import { HttpStatus } from "@utils/enums/httpStatus";
// import * as authService from "../services/authService";
// import * as emailService from "../services/emailService";
// import { SiteModel } from "@models/Site";
// import bcrypt from "bcryptjs";
// import { sendInitialPasswordEmail } from "services/emailService";

// const createUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, email, role, assignedSites } = req.body;
//     // const companyAdmin = req.userId;
//     // Assumes middleware sets req.userId

//     //   if (companyAdmin?.role !== UserRole.CompanyAdmin) {
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     // }

//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser)
//       throw new ApiError("Email already in use", HttpStatus.CONFLICT);

//     const tempPassword = authService.generateTempPassword();
//     const hashedPassword = await authService.hashPassword(tempPassword);

//     const user = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       assignedSites:
//         !assignedSites ||
//         role === UserRole.CompanyAdmin ||
//         role === UserRole.Supervisor
//           ? []
//           : assignedSites,
//       isEmailVerified: true,
//     });
//     await user.save();

//     const verificationToken = authService.generateVerificationToken(
//       user._id.toString()
//     );
//     user.verificationToken = verificationToken;
//     await user.save();
//     await emailService.sendVerificationEmail(email, verificationToken);

//     if (assignedSites && assignedSites.length > 0) {
//       await SiteModel.updateMany(
//         { _id: { $in: assignedSites } },
//         {
//           $push: {
//             [role === UserRole.SiteManager ? "siteManagers" : "architects"]:
//               user._id,
//           },
//         }
//       );
//     }
//     if (role === UserRole.Client) {
//       await SiteModel.findByIdAndUpdate(assignedSites[0], { client: user._id });
//     }

//     res
//       .status(HttpStatus.CREATED)
//       .json({ message: "User created", userId: user._id });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, name, assignedSites, isBlocked, enabledFunctionalities } =
//       req.body;
//     // const companyAdmin = req.userId;

//     // if (companyAdmin.role !== UserRole.CompanyAdmin) {
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     // }

//     const user = await UserModel.findOne({ _id: userId });
//     if (!user) throw new ApiError("User not found", HttpStatus.NOT_FOUND);

//     if (name) user.name = name;
//     if (
//       assignedSites &&
//       ![UserRole.CompanyAdmin, UserRole.Supervisor].includes(user.role)
//     ) {
//       user.assignedSites = assignedSites;
//     }
//     if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;
//     if (enabledFunctionalities)
//       user.enabledFunctionalities = enabledFunctionalities;

//     await user.save();
//     res.status(HttpStatus.OK).json({ message: "User updated" });
//   } catch (error) {
//     next(error);
//   }
// };

// const getUsers = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // const companyAdmin = req.userId;
//     // if (companyAdmin.role !== UserRole.CompanyAdmin) {
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     // }

//     const users = await UserModel.find({});
//     res.status(HttpStatus.OK).json(users);
//   } catch (error) {
//     next(error);
//   }
// };

// const getUsersByRole = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { role } = req.query;
//     const user = req.user;
//     // console.log(user, role)
//     // // Authorization check: Only CompanyAdmin can access this endpoint
//     // if (user?.role !== UserRole.CompanyAdmin) {
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     // }

//     if (
//       !role ||
//       typeof role !== "string" ||
//       !Object.values(UserRole).includes(role as UserRole)
//     ) {
//       throw new ApiError(
//         "Invalid or missing role parameter",
//         HttpStatus.BAD_REQUEST
//       );
//     }
//     // console.log("allUsers",allUsers)
//     // Fetch users with the specified role, selecting only necessary fields
//     const users = await UserModel.find({ role }).populate("assignedSites");
//     console.log(users);
//     // Map to the expected response format
//     const response = users.map((user) => ({
//       id: user._id.toString(),
//       name: user.name,
//       email: user.email,
//       isBlocked: user.isBlocked,
//       role: user.role,
//       assignedSites:
//         user.assignedSites?.map((site: any) => ({
//           id: site._id,
//           name: site.name,
//         })) || [],
//       password: user.password,
//     }));

//     res.status(HttpStatus.OK).json(response);
//   } catch (error) {
//     next(error);
//   }
// };

// const toggleStatus = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { isBlocked } = req.body;
//     const user = await UserModel.findById(id);
//     if (!user) {
//       throw new ApiError("User not found", HttpStatus.NOT_FOUND);
//     }
//     if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;
//     await user.save();
//     res.status(HttpStatus.OK).json({
//       message: "User updated successfully",
//       updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const regeneratePassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const user = await UserModel.findById(id);
//     if (!user) {
//       throw new ApiError("User not found", HttpStatus.NOT_FOUND);
//     }

//     const newPassword = Math.random().toString(36).slice(-8); // Generate random password
//     const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash with bcrypt
//     user.password = hashedPassword; // Store hashed password
//     await user.save();

//     // Send the plain password via email
//     await emailService.sendRegeneratedPasswordEmail(user.email, newPassword);

//     // Return response with the plain password
//     res.status(HttpStatus.OK).json({
//       message: "Password regenerated",
//       newPassword: newPassword,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const assignSitesToSupervisor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { siteIds } = req.body;

//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "supervisor") {
//       throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
//     }

//     // Verify all sites exist
//     if (siteIds?.length) {
//       const existingSites = await SiteModel.countDocuments({
//         _id: { $in: siteIds },
//       });
//       if (existingSites !== siteIds.length) {
//         throw new ApiError(
//           "One or more sites do not exist",
//           HttpStatus.BAD_REQUEST
//         );
//       }
//     }

//     // Get previous sites for cleanup
//     const previousSites = user.assignedSites;

//     // Update user's assigned sites
//     user.assignedSites = siteIds || [];
//     await user.save();

//     const sitesToRemoveFrom = previousSites.filter(
//       (siteId) => !siteIds.includes(siteId.toString())
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToRemoveFrom } },
//       { $pull: { supervisors: id } }
//     );

//     // Add manager to new sites
//     const sitesToAddTo = siteIds.filter(
//       (siteId: any) => !previousSites.some((s) => s.equals(siteId))
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToAddTo } },
//       { $push: { supervisors: id } }
//     );

//     res.status(HttpStatus.OK).json({
//       message: "Sites assigned successfully",
//       assignedSites: siteIds,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const createSiteManager = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { name, email, role, assignedSites } = req.body;
//     if (role !== "siteManager") {
//       throw new ApiError("Invalid role", HttpStatus.BAD_REQUEST);
//     }

//     // Check if email already exists
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//       throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
//     }

//     // Verify assigned sites exist if provided
//     if (assignedSites?.length) {
//       const existingSites = await SiteModel.countDocuments({
//         _id: { $in: assignedSites },
//       });
//       if (existingSites !== assignedSites.length) {
//         throw new ApiError(
//           "One or more assigned sites do not exist",
//           HttpStatus.BAD_REQUEST
//         );
//       }
//     }

//     const password = Math.random().toString(36).slice(-8);
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       assignedSites: assignedSites || [],
//       isEmailVerified: true,
//     });
//     await user.save();

//     if (assignedSites?.length) {
//       await SiteModel.updateMany(
//         { _id: { $in: assignedSites } },
//         { $push: { siteManagers: user._id } }
//       );
//     }

//     await sendInitialPasswordEmail(email, password);

//     res.status(HttpStatus.CREATED).json({
//       message: "Site manager created successfully",
//       user: {
//         id: user._id,
//         name,
//         email,
//         isBlocked: user.isBlocked,
//         assignedSites,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateSiteManager = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { name, email, isBlocked } = req.body;
//     console.log("this is working", isBlocked);
//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "siteManager") {
//       throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
//     }

//     if (email && email !== user.email) {
//       const emailExists = await UserModel.findOne({ email });
//       if (emailExists) {
//         throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
//       }
//     }

//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

//     await user.save();
//     res.status(HttpStatus.OK).json({
//       message: "Site manager updated successfully",
//       updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const assignSitesToManager = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { siteIds } = req.body;

//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "siteManager") {
//       throw new ApiError("Site manager not found", HttpStatus.NOT_FOUND);
//     }

//     // Verify all sites exist
//     if (siteIds?.length) {
//       const existingSites = await SiteModel.countDocuments({
//         _id: { $in: siteIds },
//       });
//       if (existingSites !== siteIds.length) {
//         throw new ApiError(
//           "One or more sites do not exist",
//           HttpStatus.BAD_REQUEST
//         );
//       }
//     }

//     // Get previous sites for cleanup
//     const previousSites = user.assignedSites;

//     // Update user's assigned sites
//     user.assignedSites = siteIds || [];
//     await user.save();

//     // Remove manager from previous sites that are no longer assigned
//     const sitesToRemoveFrom = previousSites.filter(
//       (siteId) => !siteIds.includes(siteId.toString())
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToRemoveFrom } },
//       { $pull: { siteManagers: id } }
//     );

//     // Add manager to new sites
//     const sitesToAddTo = siteIds.filter(
//       (siteId: any) => !previousSites.some((s) => s.equals(siteId))
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToAddTo } },
//       { $push: { siteManagers: id } }
//     );

//     res.status(HttpStatus.OK).json({
//       message: "Sites assigned successfully",
//       assignedSites: siteIds,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const createSupervisor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { name, email, role, assignedSites } = req.body;
//     if (role !== "supervisor") {
//       throw new ApiError("Invalid role", HttpStatus.BAD_REQUEST);
//     }
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//       throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
//     }
//     if (assignedSites?.length) {
//       const existingSites = await SiteModel.countDocuments({
//         _id: { $in: assignedSites },
//       });
//       if (existingSites !== assignedSites.length) {
//         throw new ApiError(
//           "One or more assigned sites do not exist",
//           HttpStatus.BAD_REQUEST
//         );
//       }
//     }
//     const password = Math.random().toString(36).slice(-8);
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       assignedSites: assignedSites || [],
//       isEmailVerified: true,
//     });
//     await user.save();
//     if (assignedSites?.length) {
//       await SiteModel.updateMany(
//         { _id: { $in: assignedSites } },
//         { $push: { siteManagers: user._id } } // Assuming supervisors are added to siteManagers for simplicity
//       );
//     }
//     await sendInitialPasswordEmail(email, password);
//     res.status(HttpStatus.CREATED).json({
//       message: "Supervisor created successfully",
//       user: {
//         id: user._id,
//         name,
//         email,
//         isBlocked: user.isBlocked,
//         assignedSites,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateSupervisor = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { name, email, isBlocked } = req.body;
//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "supervisor") {
//       throw new ApiError("Supervisor not found", HttpStatus.NOT_FOUND);
//     }
//     if (email && email !== user.email) {
//       const emailExists = await UserModel.findOne({ email });
//       if (emailExists) {
//         throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
//       }
//     }
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;
//     await user.save();
//     res.status(HttpStatus.OK).json({
//       message: "Supervisor updated successfully",
//       updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Append to userController.ts
// const createArchitect = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, email, assignedSites } = req.body;

//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//       throw new ApiError("Email already in use", HttpStatus.CONFLICT);
//     }

//     const password = Math.random().toString(36).slice(-8);
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       role: "architect",
//       assignedSites: assignedSites || [],
//       isEmailVerified: true,
//     });
//     await user.save();

//     if (assignedSites?.length) {
//       await SiteModel.updateMany(
//         { _id: { $in: assignedSites } },
//         { $push: { architects: user._id } }
//       );
//     }

//     await sendInitialPasswordEmail(email, password);

//     res.status(HttpStatus.CREATED).json({
//       message: "Architect created successfully",
//       user: {
//         id: user._id,
//         name,
//         email,
//         isBlocked: user.isBlocked,
//         assignedSites,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateArchitect = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const { name, email, isBlocked } = req.body;

//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "architect") {
//       throw new ApiError("Architect not found", HttpStatus.NOT_FOUND);
//     }

//     if (email && email !== user.email) {
//       const emailExists = await UserModel.findOne({ email });
//       if (emailExists) {
//         throw new ApiError("Email already in use", HttpStatus.BAD_REQUEST);
//       }
//     }

//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

//     await user.save();
//     res.status(HttpStatus.OK).json({
//       message: "Architect updated successfully",
//       updatedFields: Object.keys(req.body).filter((key) => key !== "id"),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const assignSitesToArchitect = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const { siteIds } = req.body;

//     const user = await UserModel.findById(id);
//     if (!user || user.role !== "architect") {
//       throw new ApiError("Architect not found", HttpStatus.NOT_FOUND);
//     }

//     if (siteIds?.length) {
//       const existingSites = await SiteModel.countDocuments({
//         _id: { $in: siteIds },
//       });
//       if (existingSites !== siteIds.length) {
//         throw new ApiError(
//           "One or more sites do not exist",
//           HttpStatus.BAD_REQUEST
//         );
//       }
//     }

//     const previousSites = user.assignedSites;
//     user.assignedSites = siteIds || [];
//     await user.save();

//     const sitesToRemoveFrom = previousSites.filter(
//       (siteId) => !siteIds.includes(siteId.toString())
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToRemoveFrom } },
//       { $pull: { architects: id } }
//     );

//     const sitesToAddTo = siteIds.filter(
//       (siteId: any) => !previousSites.some((s) => s.equals(siteId))
//     );
//     await SiteModel.updateMany(
//       { _id: { $in: sitesToAddTo } },
//       { $push: { architects: id } }
//     );

//     res.status(HttpStatus.OK).json({
//       message: "Sites assigned successfully",
//       assignedSites: siteIds,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export default {
//   createUser,
//   updateUser,
//   getUsers,
//   getUsersByRole,
//   toggleStatus,
//   regeneratePassword,
//   assignSitesToSupervisor,
//   createSiteManager,
//   updateSiteManager,
//   assignSitesToManager,
//   createSupervisor,
//   updateSupervisor,
//   createArchitect,
//   updateArchitect,
//   assignSitesToArchitect,
// };





// userRoutes.ts:
// import { Router } from "express";
// import userController from "@controllers/userController";

// const router = Router();

// router.get("/", userController.getUsersByRole);
// router.post("/", userController.createUser);
// router.put("/update", userController.updateUser);

// router.put("/toggleStatus/:id", userController.toggleStatus);
// router.post("/:id/regenerate-password", userController.regeneratePassword);

// router.post('/managers',userController.createSiteManager);
// router.put('/managers/:id',userController.updateSiteManager);
// router.put('/manager/:id/assign-sites',userController.assignSitesToManager);

// router.post('/supervisors', userController.createSupervisor);
// router.put('/supervisors/:id', userController.updateSupervisor);
// router.put("/supervisor/:id/assign-sites", userController.assignSitesToSupervisor);

// // Append to userRoutes.ts
// router.post('/architects', userController.createArchitect);
// router.put('/architects/:id', userController.updateArchitect);
// router.put('/architect/:id/assign-sites', userController.assignSitesToArchitect);

// export default router;




// siteController.ts:
// import { Request, Response, NextFunction } from "express";
// import { SiteModel } from "@models/Site";
// import { UserModel } from "@models/User";
// import { UserRole } from "@entities/user";
// import { ApiError } from "@utils/errors/ApiError";
// import { HttpStatus } from "@utils/enums/httpStatus";
// import mongoose from "mongoose";

// const createSite = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const {
//       name,
//       address,
//       city,
//       state,
//       zip,
//       siteManagerIds,
//       architectIds,
//       clientId,
//       budget,
//     } = req.body;
//     const user = req.user;

//     // if (user?.role !== UserRole.CompanyAdmin)
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

//     const site = new SiteModel({
//       name,
//       address,
//       city,
//       state,
//       zip,
//       siteManagers: siteManagerIds || [],
//       architects: architectIds || [],
//       client: clientId,
//       budget,
//       phases: [
//         "Site Visit",
//         "Prepare Plan and elevating detailed drawings",
//         "Permit",
//         "Settout Foundation Basement Belt Masonry, concrete work",
//         "Wiring & plumbing",
//         "Plastering, waterproofing",
//         "White washing",
//         "Floor work",
//         "Interior work",
//         "Paint work",
//       ].map((name) => ({ name })),
//     });
//     await site.save();

//     await UserModel.updateMany(
//       { _id: { $in: [...siteManagerIds, ...architectIds, clientId] } },
//       { $push: { assignedSites: site._id } }
//     );

//     res
//       .status(HttpStatus.CREATED)
//       .json({ message: "Site created", siteId: site._id });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateSite = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { siteId, siteManagerIds, architectIds, clientId, status, phases } =
//       req.body;
//     const user = req.user;

//     // if (user?.role !== UserRole.CompanyAdmin)
//     //   throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

//     const site = await SiteModel.findOne({ _id: siteId });
//     if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

//     if (siteManagerIds) site.siteManagers = siteManagerIds;
//     if (architectIds) site.architects = architectIds;
//     if (clientId) site.client = clientId;
//     if (status) site.status = status;
//     if (phases) site.phases = phases;

//     await site.save();
//     res.status(HttpStatus.OK).json({ message: "Site updated" });
//   } catch (error) {
//     next(error);
//   }
// };

// const getSiteDetails = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { siteId } = req.params;
//     const user = req.user;

//     const site = await SiteModel.findById(siteId).populate(
//       "siteManagers architects client"
//     );
//     if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

//     const userObjectId = new mongoose.Types.ObjectId(user?.userId);

//     const canAccess =
//       user?.role === UserRole.CompanyAdmin ||
//       user?.role === UserRole.Supervisor ||
//       (user?.role === UserRole.SiteManager &&
//         site.siteManagers.includes(userObjectId)) ||
//       (user?.role === UserRole.Architect &&
//         site.architects.includes(userObjectId)) ||
//       (user?.role === UserRole.Client && site.client.equals(userObjectId));

//     // if (!canAccess) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
//     console.log("sitesitesitesitesite", site);
//     res.status(HttpStatus.OK).json(site);
//   } catch (error) {
//     next(error);
//   }
// };

// const getSites = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const sites = await SiteModel.find().populate(
//       "siteManagers architects client"
//     );

//     const response = sites.map((site) => ({
//       id: site._id.toString(),
//       name: site.name,
//       address: site.address,
//       city: site.city,
//       state: site.state,
//       zip: site.zip,
//       status: site.status,
//       budget: site.budget,
//       expenses: site.expenses,
//       createdAt: site.createdAt,
//       updatedAt: site.updatedAt,
//       client: site.client
//         ? {
//             id: site.client._id.toString(),
//             name: site.client.name,
//             email: site.client.email,
//             role: site.client.role,
//             isEmailVerified: site.client.isEmailVerified,
//             isKYCCompleted: site.client.isKYCCompleted,
//             isBlocked: site.client.isBlocked,
//             isAdmin: site.client.isAdmin,
//           }
//         : null,
//       siteManagers: site.siteManagers.map((manager: any) => ({
//         id: manager._id.toString(),
//         name: manager.name,
//         email: manager.email,
//         role: manager.role,
//       })),
//       architects: site.architects.map((architect: any) => ({
//         id: architect._id.toString(),
//         name: architect.name,
//         email: architect.email,
//         role: architect.role,
//       })),
//       phases: site.phases.map((phase: any) => ({
//         // Adjust according to actual phase structure
//         ...phase.toObject(),
//         id: phase._id?.toString?.(),
//       })),
//     }));

//     res.status(HttpStatus.OK).json(response);
//   } catch (error) {
//     next(error);
//   }
// };


// export default {
//   createSite,
//   updateSite,
//   getSiteDetails,
//   getSites,
// };




// siteRoutes.ts:
// import { Router } from "express";
// import siteController from "@controllers/siteController";

// const router = Router();

// router.get("/", siteController.getSites);
// router.get("/:siteId", siteController.getSiteDetails);
// router.post("/", siteController.createSite);
// router.put("/", siteController.updateSite);

// export default router;
