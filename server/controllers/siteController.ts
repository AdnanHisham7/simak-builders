import { Request, Response, NextFunction } from "express";
import { SiteModel } from "@models/Site";
import { UserModel } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";
import { PurchaseModel } from "@models/Purchase";
import archiver from "archiver";
import { createReadStream } from "fs";
import { join } from "path";
import * as fs from "fs/promises";

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
      { $addToSet: { assignedSites: site._id } } // Add site ID to assignedSites array
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
      const client = await UserModel.findOne({ _id: clientId, role: "client" });
      if (!client) throw new ApiError("Invalid client", HttpStatus.BAD_REQUEST);
      usersToUpdate.push(clientId);
    }
    if (usersToUpdate.length) {
      await UserModel.updateMany(
        { _id: { $in: usersToUpdate } },
        { $push: { assignedSites: site._id } }
      );
    }

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
      clientId,
      status,
      phases,
      siteManagerIds,
      architectIds,
      supervisorIds,
    } = req.body;
    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    if (clientId && clientId !== site.client.toString()) {
      await UserModel.updateOne(
        { _id: site.client },
        { $pull: { assignedSites: site._id } }
      );
      await UserModel.updateOne(
        { _id: clientId },
        { $push: { assignedSites: site._id } }
      );
      site.client = clientId;
    }
    if (status) site.status = status;
    if (phases) site.phases = phases;

    const updateAssignedSites = async (
      ids: string[],
      role: string,
      currentIds: string[]
    ) => {
      const toRemove = currentIds.filter((id) => !ids.includes(id));
      const toAdd = ids.filter((id) => !currentIds.includes(id));
      if (toRemove.length) {
        await UserModel.updateMany(
          { _id: { $in: toRemove }, role },
          { $pull: { assignedSites: siteId } }
        );
      }
      if (toAdd.length) {
        await UserModel.updateMany(
          { _id: { $in: toAdd }, role },
          { $push: { assignedSites: siteId } }
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
        currentSupervisors
      );

    await site.save();
    res.status(HttpStatus.OK).json({ message: "Site updated" });
  } catch (error) {
    next(error);
  }
};

const getSiteDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const site = await SiteModel.findById(siteId).populate(
      "documents.uploadedBy",
      "name"
    );
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    const siteManagers = await UserModel.find({
      role: "siteManager",
      assignedSites: siteId,
    });
    const architects = await UserModel.find({
      role: "architect",
      assignedSites: siteId,
    });
    const supervisors = await UserModel.find({
      role: "supervisor",
      assignedSites: siteId,
    });
    const client = await UserModel.findById(site.client);

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

const getSites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    let sites;

    if (
      user?.role === "siteManager" ||
      user?.role === "supervisor" ||
      user?.role === "architect"
    ) {
      sites = await SiteModel.aggregate([
        { $match: { _id: { $in: user?.assignedSites } } },
        {
          $lookup: {
            from: "users",
            let: { siteId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$$siteId", "$assignedSites"] },
                  role: "siteManager",
                },
              },
            ],
            as: "siteManagers",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { siteId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$$siteId", "$assignedSites"] },
                  role: "architect",
                },
              },
            ],
            as: "architects",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "client",
            foreignField: "_id",
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
          },
        },
      ]);
    } else {
      sites = await SiteModel.aggregate([
        {
          $lookup: {
            from: "users",
            let: { siteId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$$siteId", "$assignedSites"] },
                  role: "siteManager",
                },
              },
            ],
            as: "siteManagers",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { siteId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$$siteId", "$assignedSites"] },
                  role: "architect",
                },
              },
            ],
            as: "architects",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "client",
            foreignField: "_id",
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
          },
        },
      ]);
    }

    // Populate documents.uploadedBy separately if needed
    sites = await SiteModel.populate(sites, {
      path: "documents.uploadedBy",
      select: "name",
    });

    res.status(HttpStatus.OK).json(sites);
  } catch (error) {
    next(error);
  }
};

const updatePhaseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      console.log(phase.status, status);
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

    res.status(HttpStatus.OK).json({ message: "Phase status updated" });
  } catch (error) {
    next(error);
  }
};

const approvePhase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phaseId } = req.params;
    const site = await SiteModel.findOne({ "phases._id": phaseId });
    if (!site) throw new ApiError("Phase not found", HttpStatus.NOT_FOUND);

    const phase = site.phases.find((p) => p._id === phaseId);
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

    res.status(HttpStatus.OK).json({ message: "Phase approved" });
  } catch (error) {
    next(error);
  }
};

const rejectPhase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phaseId } = req.params;
    const site = await SiteModel.findOne({ "phases._id": phaseId });
    if (!site) throw new ApiError("Phase not found", HttpStatus.NOT_FOUND);

    const phase = site.phases.find((p) => p._id === phaseId);
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

    res.status(HttpStatus.OK).json({ message: "Phase rejected" });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const user = await UserModel.findById(req.user?.userId);
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

    const document:any = {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadDate: new Date(),
      url: `/uploads/${file.filename}`,
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
  next: NextFunction
) => {
  try {
    const { clientId } = req.params;
    const site = await SiteModel.findOne({ client: clientId }).populate(
      "client"
    );
    if (!site)
      throw new ApiError(
        "Site not found for this client",
        HttpStatus.NOT_FOUND
      );
    res.status(HttpStatus.OK).json(site);
  } catch (error) {
    next(error);
  }
};

const downloadSiteDocumentsZip = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const documents:any = site.documents;
    if (documents.length === 0) {
      res.status(HttpStatus.NO_CONTENT).send("No documents to download");
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=site_${site?.name}_documents.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const doc of documents) {
      const filePath = join(process.cwd(), "uploads", doc.url.split("/").pop());
      archive.append(createReadStream(filePath), { name: doc.name });
    }

    archive.finalize();
  } catch (error) {
    next(error);
  }
};

const downloadPurchaseBillsZip = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const purchases = await PurchaseModel.find({ site: siteId });
    const billUploads:any = purchases
      .filter((p) => p.billUpload?.url)
      .map((p) => p.billUpload);

    if (billUploads.length === 0) {
      res.status(HttpStatus.NO_CONTENT).send("No bills to download");
      return;
    }

    const site = await SiteModel.findById(siteId);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=site_${site?.name}_purchase_bills.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const bill of billUploads) {
      const filePath = join(
        process.cwd(),
        "uploads",
        bill.url.split("/").pop()
      );
      archive.append(createReadStream(filePath), { name: bill.name });
    }

    archive.finalize();
  } catch (error) {
    next(error);
  }
};

const markSiteAsCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const { deleteSiteDocuments, deletePurchaseBills } = req.body;

    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const site:any = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    if (site.status === "Completed") {
      throw new ApiError("Site is already completed", HttpStatus.BAD_REQUEST);
    }

    if (deleteSiteDocuments) {
      for (const doc of site.documents) {
        const filePath = join(
          process.cwd(),
          "uploads",
          doc.url.split("/").pop()
        );
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
      site.documents = [];
    }

    if (deletePurchaseBills) {
      const purchases:any = await PurchaseModel.find({ site: siteId });
      for (const purchase of purchases) {
        console.log("filePath", purchase);
        if (purchase.billUpload?.url) {
          console.log("hi push");
          const filePath = join(
            process.cwd(),
            "uploads",
            purchase.billUpload.url.split("/").pop()
          );
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.error(`Error deleting file ${filePath}:`, err);
          }
          await PurchaseModel.updateOne(
            { _id: purchase._id },
            { $unset: { billUpload: "" } }
          );
          await purchase.save();
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

    res.status(HttpStatus.OK).json({ message: "Site marked as completed" });
  } catch (error) {
    next(error);
  }
};

export default {
  createSite,
  updateSite,
  getSiteDetails,
  getSites,
  updatePhaseStatus,
  uploadDocument,
  approvePhase,
  rejectPhase,
  getSiteByClient,
  downloadPurchaseBillsZip,
  downloadSiteDocumentsZip,
  markSiteAsCompleted,
};
