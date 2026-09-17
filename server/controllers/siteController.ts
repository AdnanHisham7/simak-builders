import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { UserModel } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";
import { PurchaseModel } from "@models/Purchase";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { ContractorTransactionModel } from "@models/ContractorTransaction";
import archiver from "archiver";
import { createReadStream } from "fs";
import { join } from "path";
import * as fs from "fs/promises";
import axios from "axios";
import cloudinary from "../services/cloudinaryService";
import {
  cacheGet,
  cacheSet,
  bumpCacheVersion,
  getCacheVersion,
} from "@config/redis";

const SITES_CACHE_NAMESPACE = "sites";
const SITES_CACHE_TTL_SECONDS = 300;

const createSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zip,
      siteManagerIds,
      architectIds,
      clientId,
      budget,
    } = req.body;
    const site = new SiteModel({
      name,
      address,
      city,
      state,
      zip,
      client: clientId,
      budget,
      phases: [
        "Site Visit",
        "Prepare Plan and elevating detailed drawings",
        "Permit",
        "Settout Foundation Basement Belt Masonry, concrete work",
        "Wiring & plumbing",
        "Plastering, waterproofing",
        "White washing",
        "Floor work",
        "Interior work",
        "Paint work",
      ].map((name) => ({ name })),
    });
    await site.save();

    await UserModel.findByIdAndUpdate(
      clientId,
      { $addToSet: { assignedSites: site._id } }, // Add site ID to assignedSites array
    );

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "site",
      resourceId: site._id,
      details: `Created site: ${site.name}`,
    });

    const usersToUpdate = [];
    if (siteManagerIds?.length) {
      const managers = await UserModel.find({
        _id: { $in: siteManagerIds },
        role: "siteManager",
      });
      if (managers.length !== siteManagerIds.length)
        throw new ApiError("Invalid site managers", HttpStatus.BAD_REQUEST);
      usersToUpdate.push(...siteManagerIds);
    }
    if (architectIds?.length) {
      const architects = await UserModel.find({
        _id: { $in: architectIds },
        role: "architect",
      });
      if (architects.length !== architectIds.length)
        throw new ApiError("Invalid architects", HttpStatus.BAD_REQUEST);
      usersToUpdate.push(...architectIds);
    }
    if (clientId) {
      const client = await UserModel.findOne({
        _id: clientId,
        role: "client",
        isDeleted: { $ne: true },
      });
      if (!client) throw new ApiError("Invalid client", HttpStatus.BAD_REQUEST);
      usersToUpdate.push(clientId);
    }
    if (usersToUpdate.length) {
      await UserModel.updateMany(
        { _id: { $in: usersToUpdate } },
        { $push: { assignedSites: site._id } },
      );
    }

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Site created", siteId: site._id });
  } catch (error) {
    next(error);
  }
};

const updateSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      siteId,
      name,
      address,
      city,
      state,
      zip,
      clientId,
      status,
      phases,
      siteManagerIds,
      architectIds,
      supervisorIds,
    } = req.body;

    if (!siteId || typeof siteId !== "string") {
      throw new ApiError("Site ID is required", HttpStatus.BAD_REQUEST);
    }

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const isEditingSiteDetails =
      name !== undefined ||
      address !== undefined ||
      city !== undefined ||
      state !== undefined ||
      zip !== undefined;

    if (isEditingSiteDetails) {
      if (req.user?.role !== "admin") {
        throw new ApiError(
          "Only admins can edit site details",
          HttpStatus.FORBIDDEN,
        );
      }

      const fields: Record<string, unknown> = { name, address, city, state, zip };
      const trimmedValues: Record<string, string> = {};

      for (const field of ["name", "address", "city", "state", "zip"] as const) {
        const rawValue = fields[field];
        const nextValue = rawValue === undefined ? site[field] : rawValue;
        if (typeof nextValue !== "string" || !nextValue.trim()) {
          throw new ApiError(
            "Site name, address, city, state, and zip code are all required",
            HttpStatus.BAD_REQUEST,
          );
        }
        trimmedValues[field] = nextValue.trim();
      }

      site.name = trimmedValues.name;
      site.address = trimmedValues.address;
      site.city = trimmedValues.city;
      site.state = trimmedValues.state;
      site.zip = trimmedValues.zip;
    }

    if (clientId && clientId !== site.client.toString()) {
      await UserModel.updateOne(
        { _id: site.client },
        { $pull: { assignedSites: site._id } },
      );
      await UserModel.updateOne(
        { _id: clientId },
        { $push: { assignedSites: site._id } },
      );
      site.client = clientId;
    }
    if (status) site.status = status;
    if (phases) site.phases = phases;

    const updateAssignedSites = async (
      ids: string[],
      role: string,
      currentIds: string[],
    ) => {
      const toRemove = currentIds.filter((id) => !ids.includes(id));
      const toAdd = ids.filter((id) => !currentIds.includes(id));
      if (toRemove.length) {
        await UserModel.updateMany(
          { _id: { $in: toRemove }, role },
          { $pull: { assignedSites: siteId } },
        );
      }
      if (toAdd.length) {
        await UserModel.updateMany(
          { _id: { $in: toAdd }, role },
          { $push: { assignedSites: siteId } },
        );
      }
    };

    const currentManagers = (
      await UserModel.find({ role: "siteManager", assignedSites: siteId })
    ).map((u) => u._id.toString());
    const currentArchitects = (
      await UserModel.find({ role: "architect", assignedSites: siteId })
    ).map((u) => u._id.toString());
    const currentSupervisors = (
      await UserModel.find({ role: "supervisor", assignedSites: siteId })
    ).map((u) => u._id.toString());

    if (siteManagerIds)
      await updateAssignedSites(siteManagerIds, "siteManager", currentManagers);
    if (architectIds)
      await updateAssignedSites(architectIds, "architect", currentArchitects);
    if (supervisorIds)
      await updateAssignedSites(
        supervisorIds,
        "supervisor",
        currentSupervisors,
      );

    await site.save();
    await bumpCacheVersion(SITES_CACHE_NAMESPACE);

    if (isEditingSiteDetails) {
      await ActivityLogModel.create({
        user: req.user?.userId,
        action: "update",
        resource: "site",
        resourceId: site._id,
        details: `Updated site details for: ${site.name}`,
      });
    }

    res.status(HttpStatus.OK).json({ message: "Site updated" });
  } catch (error) {
    next(error);
  }
};

const updateSupervisionPercentage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const { supervisionPercentage } = req.body;

    if (req.user?.role !== "admin") {
      throw new ApiError(
        "Only admins can update the supervision percentage",
        HttpStatus.FORBIDDEN,
      );
    }

    const parsed = Number(supervisionPercentage);
    if (
      supervisionPercentage === undefined ||
      supervisionPercentage === null ||
      supervisionPercentage === "" ||
      Number.isNaN(parsed) ||
      parsed < 0 ||
      parsed > 100
    ) {
      throw new ApiError(
        "Supervision percentage must be a number between 0 and 100",
        HttpStatus.BAD_REQUEST,
      );
    }

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    site.supervisionPercentage = parsed;
    await site.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "site",
      resourceId: site._id,
      details: `Updated supervision percentage to ${parsed}% for site: ${site.name}`,
    });

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);

    res.status(HttpStatus.OK).json({
      message: "Supervision percentage updated",
      supervisionPercentage: site.supervisionPercentage,
    });
  } catch (error) {
    next(error);
  }
};

const getSiteDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const site = await SiteModel.findById(siteId)
      .populate("documents.uploadedBy", "name")
      .lean();
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    const [siteManagers, architects, supervisors, client] = await Promise.all(
      [
        UserModel.find({ role: "siteManager", assignedSites: siteId }).lean(),
        UserModel.find({ role: "architect", assignedSites: siteId }).lean(),
        UserModel.find({ role: "supervisor", assignedSites: siteId }).lean(),
        UserModel.findById(site.client).lean(),
      ],
    );

    res.status(HttpStatus.OK).json({
      site,
      siteManagers,
      architects,
      supervisors,
      client,
      transactions: site.transactions,
    });
  } catch (error) {
    next(error);
  }
};

const getSiteStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.authUser;
    const isRestrictedRole =
      user?.role === "siteManager" ||
      user?.role === "supervisor" ||
      user?.role === "architect";

    const matchStage: Record<string, any> = {};
    if (isRestrictedRole) {
      matchStage._id = { $in: user?.assignedSites || [] };
    }

    const version = await getCacheVersion(SITES_CACHE_NAMESPACE);
    const cacheKey = isRestrictedRole
      ? `${SITES_CACHE_NAMESPACE}:v${version}:stats:user:${req.user?.userId}`
      : `${SITES_CACHE_NAMESPACE}:v${version}:stats:all`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const stats = await SiteModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSites: { $sum: 1 },
          totalBudget: { $sum: { $ifNull: ["$budget", 0] } },
          completedSites: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $toLower: { $ifNull: ["$status", ""] } },
                    "completed",
                  ],
                },
                1,
                0,
              ],
            },
          },
          activeSites: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $toLower: { $ifNull: ["$status", ""] } },
                    ["active", "in progress", "inprogress"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          statuses: { $addToSet: "$status" },
        },
      },
    ]);

    const result = stats[0] || {
      totalSites: 0,
      totalBudget: 0,
      completedSites: 0,
      activeSites: 0,
      statuses: ["InProgress", "Completed"],
    };

    const validStatuses = Array.from(
      new Set(
        (result.statuses || []).filter(
          (s: any) => typeof s === "string" && s.trim().length > 0,
        ),
      ),
    );

    const responseBody = {
      totalSites: result.totalSites || 0,
      totalBudget: result.totalBudget || 0,
      completedSites: result.completedSites || 0,
      activeSites: result.activeSites || 0,
      statuses:
        validStatuses.length > 0 ? validStatuses : ["InProgress", "Completed"],
    };

    await cacheSet(cacheKey, responseBody, SITES_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const getSites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.authUser;
    let sites;

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 0;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status =
      typeof req.query.status === "string" &&
      req.query.status !== "All Statuses"
        ? req.query.status
        : "";
    const isPaginated = page > 0 && limit > 0;
    const includeDocuments = req.query.includeDocuments === "true";

    const version = await getCacheVersion(SITES_CACHE_NAMESPACE);
    const isRestrictedRole =
      user?.role === "siteManager" ||
      user?.role === "supervisor" ||
      user?.role === "architect";
    const paginationSuffix = isPaginated
      ? `:page:${page}:limit:${limit}:search:${search}:status:${status}`
      : `:includeDocs:${includeDocuments}`;
    const cacheKey = isRestrictedRole
      ? `${SITES_CACHE_NAMESPACE}:v${version}:user:${req.user?.userId}${paginationSuffix}`
      : `${SITES_CACHE_NAMESPACE}:v${version}:all${paginationSuffix}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.status(HttpStatus.OK).json(cached);
      return;
    }

    const searchMatchStage =
      search.length > 0
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { address: { $regex: search, $options: "i" } },
                  { city: { $regex: search, $options: "i" } },
                  { state: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : [];
    const statusMatchStage =
      status.length > 0 ? [{ $match: { status } }] : [];
    const paginationStages = isPaginated
      ? [{ $skip: (page - 1) * limit }, { $limit: limit }]
      : [];

    const pipeline: any[] = [
      ...(isRestrictedRole
        ? [{ $match: { _id: { $in: user?.assignedSites || [] } } }]
        : []),
      ...searchMatchStage,
      ...statusMatchStage,
      { $sort: { createdAt: -1 } },
      ...paginationStages,
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "assignedSites",
          pipeline: [
            {
              $match: {
                role: "siteManager",
                isDeleted: { $ne: true },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "siteManagers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "assignedSites",
          pipeline: [
            {
              $match: {
                role: "architect",
                isDeleted: { $ne: true },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "architects",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          siteManagerCount: { $size: "$siteManagers" },
          architectCount: { $size: "$architects" },
          completedPhases: {
            $size: {
              $filter: {
                input: "$phases",
                cond: { $eq: ["$$this.status", "completed"] },
              },
            },
          },
          totalPhases: { $size: "$phases" },
        },
      },
      {
        $project: {
          siteManagers: 0,
          architects: 0,
          ...(isPaginated || !includeDocuments
            ? { transactions: 0, documents: 0 }
            : {}),
        },
      },
    ];

    sites = await SiteModel.aggregate(pipeline);

    if (!isPaginated && includeDocuments) {
      sites = await SiteModel.populate(sites, {
        path: "documents.uploadedBy",
        select: "name",
      });
    }

    let responseBody: unknown = sites;

    if (isPaginated) {
      const countMatch: Record<string, any> = {};
      if (isRestrictedRole) {
        countMatch._id = { $in: user?.assignedSites || [] };
      }
      if (search.length > 0) {
        countMatch.$or = [
          { name: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
        ];
      }
      if (status.length > 0) {
        countMatch.status = status;
      }
      const total = await SiteModel.countDocuments(countMatch);

      responseBody = {
        sites,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      };
    }

    await cacheSet(cacheKey, responseBody, SITES_CACHE_TTL_SECONDS);

    res.status(HttpStatus.OK).json(responseBody);
  } catch (error) {
    next(error);
  }
};

const updatePhaseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId, phaseId } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const phase = site.phases.find((p) => p._id?.toString() === phaseId);
    if (!phase) throw new ApiError("Phase not found", HttpStatus.NOT_FOUND);

    if (user.role === "siteManager") {
      if (phase.status !== "not started" || status !== "pending") {
        throw new ApiError("Unauthorized status change", HttpStatus.FORBIDDEN);
      }
      phase.status = "pending";
      phase.requestedBy = user.userId;
      await site.save();

      const admins = await UserModel.find({ role: "admin" });
      for (const admin of admins) {
        const notification = new NotificationModel({
          user: admin._id,
          type: "phase_status_verification",
          relatedId: phase._id,
          message: `Phase "${phase.name}" for site "${site.name}" is pending verification`,
          status: "pending",
        });
        await notification.save();
      }
    } else if (user.role === "admin") {
      if (status === "completed" || status === "not started") {
        phase.status = status;
        if (status === "completed") {
          phase.completionDate = new Date();
        }
        await site.save();

        if (phase.requestedBy) {
          const message =
            status === "completed"
              ? `Your request for phase "${phase.name}" in site "${site.name}" has been approved`
              : `Your request for phase "${phase.name}" in site "${site.name}" has been rejected`;
          const notification = new NotificationModel({
            user: phase.requestedBy,
            type: "phase_status_update",
            relatedId: phase._id,
            message,
            status: status === "completed" ? "approved" : "rejected",
          });
          await notification.save();
        }
      } else {
        throw new ApiError("Invalid status change", HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Phase status updated" });
  } catch (error) {
    next(error);
  }
};

const approvePhase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { phaseId } = req.params;
    const site = await SiteModel.findOne({ "phases._id": phaseId });
    if (!site) throw new ApiError("Phase not found", HttpStatus.NOT_FOUND);

    const phase = site.phases.find((p) => p._id?.toString() === phaseId);
    if (!phase || phase.status !== "pending") {
      throw new ApiError("Invalid phase status", HttpStatus.BAD_REQUEST);
    }

    phase.status = "completed";
    phase.completionDate = new Date();
    await site.save();

    if (phase.requestedBy) {
      const notification = new NotificationModel({
        user: phase.requestedBy,
        type: "phase_status_update",
        relatedId: phase._id,
        message: `Your request for phase "${phase.name}" in site "${site.name}" has been approved`,
        status: "approved",
      });
      await notification.save();
    }

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Phase approved" });
  } catch (error) {
    next(error);
  }
};

const rejectPhase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { phaseId } = req.params;
    const site = await SiteModel.findOne({ "phases._id": phaseId });
    if (!site) throw new ApiError("Phase not found", HttpStatus.NOT_FOUND);

    const phase = site.phases.find((p) => p._id?.toString() === phaseId);
    if (!phase || phase.status !== "pending") {
      throw new ApiError("Invalid phase status", HttpStatus.BAD_REQUEST);
    }

    phase.status = "not started";
    await site.save();

    if (phase.requestedBy) {
      const notification = new NotificationModel({
        user: phase.requestedBy,
        type: "phase_status_update",
        relatedId: phase._id,
        message: `Your request for phase "${phase.name}" in site "${site.name}" has been rejected`,
        status: "rejected",
      });
      await notification.save();
    }

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Phase rejected" });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const user = req.authUser;
    if (
      user?.role !== "admin" &&
      !user?.assignedSites.some((id: any) => id.toString() === siteId)
    ) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const file = req.file;
    if (!file) throw new ApiError("No file uploaded", HttpStatus.BAD_REQUEST);

    const category = req.body.category;
    if (!category || !["client", "site"].includes(category)) {
      throw new ApiError("Invalid or missing category", HttpStatus.BAD_REQUEST);
    }

    const document: any = {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadDate: new Date(),
      url: file.path,
      public_id: file.filename,
      uploadedBy: req.user?.userId,
      category: category,
    };

    site.documents.push(document);
    await site.save();

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Document uploaded", document });
  } catch (error) {
    next(error);
  }
};

const getSiteByClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { clientId } = req.params;
    const site = await SiteModel.findOne({ client: clientId }).populate(
      "client",
    );
    if (!site)
      throw new ApiError(
        "Site not found for this client",
        HttpStatus.NOT_FOUND,
      );
    res.status(HttpStatus.OK).json(site);
  } catch (error) {
    next(error);
  }
};

const downloadSiteDocumentsZip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;

    const site: any = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const documents = site.documents;
    if (documents.length === 0) {
      res.status(HttpStatus.NO_CONTENT).send("No documents to download");
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=site_${site?.name}_documents.zip`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const doc of documents) {
      const response = await axios.get(doc.url, { responseType: "stream" });

      archive.append(response.data, { name: doc.name });
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

const downloadPurchaseBillsZip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;

    const purchases: any = await PurchaseModel.find({ site: siteId });

    const billUploads = purchases
      .filter((p: any) => p.billUpload?.url)
      .map((p: any) => p.billUpload);

    if (billUploads.length === 0) {
      res.status(HttpStatus.NO_CONTENT).send("No bills to download");
      return;
    }

    const site: any = await SiteModel.findById(siteId);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=site_${site?.name}_purchase_bills.zip`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const bill of billUploads) {
      const response = await axios.get(bill.url, { responseType: "stream" });

      archive.append(response.data, { name: bill.name });
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

const markSiteAsCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { siteId } = req.params;
    const { deleteSiteDocuments, deletePurchaseBills } = req.body;

    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const site: any = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    if (site.status === "Completed") {
      throw new ApiError("Site is already completed", HttpStatus.BAD_REQUEST);
    }

    if (deleteSiteDocuments) {
      for (const doc of site.documents) {
        if (doc.public_id) {
          try {
            await cloudinary.uploader.destroy(doc.public_id, {
              resource_type: "auto",
            });
          } catch (err) {
            console.error(`Cloudinary delete failed:`, err);
          }
        }
      }

      site.documents = [];
    }

    if (deletePurchaseBills) {
      const purchases: any = await PurchaseModel.find({ site: siteId });

      for (const purchase of purchases) {
        if (purchase.billUpload?.public_id) {
          try {
            await cloudinary.uploader.destroy(purchase.billUpload.public_id, {
              resource_type: "auto",
            });
          } catch (err) {
            console.error("Cloudinary delete failed:", err);
          }

          await PurchaseModel.updateOne(
            { _id: purchase._id },
            { $unset: { billUpload: "" } },
          );
        }
      }
    }

    site.status = "Completed";
    await site.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "site",
      resourceId: site._id,
      details: `Marked site as completed: ${site.name}`,
    });

    await bumpCacheVersion(SITES_CACHE_NAMESPACE);
    res.status(HttpStatus.OK).json({ message: "Site marked as completed" });
  } catch (error) {
    next(error);
  }
};

const getSiteBudgetAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const site = await SiteModel.findById(siteId).lean();
    if (!site) {
      throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    const [purchases, miscExpenses, contractorTransactions] = await Promise.all([
      PurchaseModel.find({ site: siteId, deletedAt: null }).lean(),
      MiscellaneousExpenseModel.find({ site: siteId, deletedAt: null }).lean(),
      ContractorTransactionModel.find({ site: siteId }).populate("contractor", "name").lean(),
    ]);

    // 1. Purchases totals & category breakdown
    let totalPurchases = 0;
    let totalPurchasesPaid = 0;
    const purchaseCategoryMap: Record<string, number> = {};
    const topItemCostsMap: Record<string, { quantity: number; unit: string; totalAmount: number }> = {};

    purchases.forEach((p: any) => {
      const pAmount = (Number(p.totalAmount) || 0) + (Number(p.transportationFee) || 0);
      totalPurchases += pAmount;
      if (p.payment?.isPaid) {
        totalPurchasesPaid += pAmount;
      } else if (p.payment?.paidAmount) {
        totalPurchasesPaid += Number(p.payment.paidAmount) || 0;
      }

      if (Array.isArray(p.items)) {
        p.items.forEach((item: any) => {
          const cat = item.category?.trim() || "Materials";
          const itemAmt = Number(item.totalAmount) || 0;
          purchaseCategoryMap[cat] = (purchaseCategoryMap[cat] || 0) + itemAmt;

          const itemName = item.name?.trim() || "Unknown Item";
          if (!topItemCostsMap[itemName]) {
            topItemCostsMap[itemName] = { quantity: 0, unit: item.unit || "", totalAmount: 0 };
          }
          topItemCostsMap[itemName].quantity += Number(item.quantity) || 0;
          topItemCostsMap[itemName].totalAmount += itemAmt;
        });
      }
    });

    // 2. Miscellaneous expenses totals & category breakdown
    let totalMisc = 0;
    const miscCategoryMap: Record<string, number> = {};
    miscExpenses.forEach((m: any) => {
      const mAmt = (Number(m.amount) || 0) + (Number(m.tip) || 0);
      totalMisc += mAmt;
      const cat = m.category?.trim() || "miscellaneous";
      miscCategoryMap[cat] = (miscCategoryMap[cat] || 0) + mAmt;
    });

    // 3. Contractor transactions totals & contractor breakdown
    let totalContractor = 0;
    contractorTransactions.forEach((c: any) => {
      const cAmt = Number(c.amount) || 0;
      totalContractor += cAmt;
    });

    // 4. Attendance / Supervision / Direct Transactions
    let totalAttendance = 0;
    if (Array.isArray(site.transactions)) {
      site.transactions.forEach((tx: any) => {
        if (tx.type === "attendance") {
          totalAttendance += Number(tx.amount) || 0;
        }
      });
    }

    const granularSum = totalPurchases + totalMisc + totalContractor + totalAttendance;
    const unaccountedSiteExpense = Math.max(0, (site.expenses || 0) - granularSum);
    const totalSpent = granularSum + unaccountedSiteExpense;

    // 5. Monthly Trend & Burn-Rate Series
    const monthlyDataMap: Record<string, {
      month: string;
      purchases: number;
      contractor: number;
      miscellaneous: number;
      attendance: number;
      other: number;
      total: number;
    }> = {};

    const addMonthly = (date: Date | string | undefined, amount: number, field: "purchases" | "contractor" | "miscellaneous" | "attendance" | "other") => {
      if (!date || !amount) return;
      const d = new Date(date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyDataMap[key]) {
        const monthLabel = d.toLocaleString("en-US", { month: "short", year: "numeric" });
        monthlyDataMap[key] = {
          month: monthLabel,
          purchases: 0,
          contractor: 0,
          miscellaneous: 0,
          attendance: 0,
          other: 0,
          total: 0,
        };
      }
      monthlyDataMap[key][field] += amount;
      monthlyDataMap[key].total += amount;
    };

    purchases.forEach((p: any) => addMonthly(p.date || p.createdAt, (Number(p.totalAmount) || 0) + (Number(p.transportationFee) || 0), "purchases"));
    miscExpenses.forEach((m: any) => addMonthly(m.date || m.createdAt, (Number(m.amount) || 0) + (Number(m.tip) || 0), "miscellaneous"));
    contractorTransactions.forEach((c: any) => addMonthly(c.date || c.createdAt, Number(c.amount) || 0, "contractor"));
    if (Array.isArray(site.transactions)) {
      site.transactions.forEach((tx: any) => {
        if (tx.type === "attendance") {
          addMonthly(tx.date, Number(tx.amount) || 0, "attendance");
        } else if (!["purchase", "miscellaneous", "contractor_payment"].includes(tx.type)) {
          addMonthly(tx.date, Number(tx.amount) || 0, "other");
        }
      });
    }

    const sortedKeys = Object.keys(monthlyDataMap).sort();
    if (sortedKeys.length === 0) {
      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      sortedKeys.push(currentKey);
      monthlyDataMap[currentKey] = {
        month: now.toLocaleString("en-US", { month: "short", year: "numeric" }),
        purchases: 0,
        contractor: 0,
        miscellaneous: 0,
        attendance: 0,
        other: 0,
        total: 0,
      };
    }

    let runningSpend = 0;
    const totalBudget = site.budget || 0;
    const numMonths = sortedKeys.length;
    const monthlyPlannedPace = totalBudget / Math.max(numMonths, 6);

    const monthlyTrends = sortedKeys.map((key, index) => {
      const entry = monthlyDataMap[key];
      runningSpend += entry.total;
      const plannedCumulative = Math.min(totalBudget, Math.round(monthlyPlannedPace * (index + 1)));
      return {
        key,
        month: entry.month,
        purchases: Math.round(entry.purchases),
        contractor: Math.round(entry.contractor),
        miscellaneous: Math.round(entry.miscellaneous),
        attendance: Math.round(entry.attendance),
        other: Math.round(entry.other),
        monthlySpend: Math.round(entry.total),
        cumulativeSpend: Math.round(runningSpend),
        plannedSpend: plannedCumulative,
      };
    });

    const categoryBreakdown = [
      { name: "Purchases & Materials", value: Math.round(totalPurchases), color: "#2563eb" },
      { name: "Contractors", value: Math.round(totalContractor), color: "#7c3aed" },
      { name: "Machinery & Equipment", value: Math.round(miscCategoryMap["machinery"] || 0), color: "#d97706" },
      { name: "Rentals", value: Math.round(miscCategoryMap["rental"] || 0), color: "#059669" },
      { name: "Services", value: Math.round(miscCategoryMap["service"] || 0), color: "#0891b2" },
      { name: "Labor & Attendance", value: Math.round(totalAttendance), color: "#db2777" },
      { name: "Other Expenses", value: Math.round((miscCategoryMap["material"] || 0) + unaccountedSiteExpense), color: "#64748b" },
    ].filter((item) => item.value > 0);

    const activeMonths = Math.max(1, sortedKeys.length);
    const averageMonthlyBurnRate = Math.round(totalSpent / activeMonths);
    const remainingBudget = totalBudget - totalSpent;
    const budgetUtilization = totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;
    const estimatedMonthsRemaining =
      averageMonthlyBurnRate > 0 && remainingBudget > 0
        ? Number((remainingBudget / averageMonthlyBurnRate).toFixed(1))
        : 0;

    let healthStatus: "on_track" | "warning" | "exceeded" = "on_track";
    if (budgetUtilization >= 100) {
      healthStatus = "exceeded";
    } else if (budgetUtilization >= 80 || (remainingBudget < averageMonthlyBurnRate && remainingBudget > 0)) {
      healthStatus = "warning";
    }

    const topCostDrivers = Object.entries(topItemCostsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    res.status(HttpStatus.OK).json({
      siteId: site._id,
      siteName: site.name,
      totalBudget,
      totalSpent: Math.round(totalSpent),
      remainingBudget: Math.round(remainingBudget),
      budgetUtilization,
      averageMonthlyBurnRate,
      estimatedMonthsRemaining,
      healthStatus,
      activeMonths,
      breakdown: {
        purchases: Math.round(totalPurchases),
        purchasesPaid: Math.round(totalPurchasesPaid),
        purchasesPending: Math.round(totalPurchases - totalPurchasesPaid),
        miscellaneous: Math.round(totalMisc),
        contractor: Math.round(totalContractor),
        attendance: Math.round(totalAttendance),
        unaccounted: Math.round(unaccountedSiteExpense),
      },
      categoryBreakdown,
      monthlyTrends,
      topCostDrivers,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createSite,
  updateSite,
  updateSupervisionPercentage,
  getSiteDetails,
  getSites,
  getSiteStats,
  updatePhaseStatus,
  uploadDocument,
  approvePhase,
  rejectPhase,
  getSiteByClient,
  downloadPurchaseBillsZip,
  downloadSiteDocumentsZip,
  markSiteAsCompleted,
  getSiteBudgetAnalysis,
};