import { Request, Response, NextFunction } from "express";
import { ProjectModel, ProjectGalleryImage } from "@models/Project";
import { SiteModel } from "@models/Site";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";
import cloudinary from "../services/cloudinaryService";
import { UserRole } from "@entities/user";

const isAdmin = (req: Request) => req.user?.role === UserRole.CompanyAdmin;

const PUBLIC_PROJECT_FIELDS =
  "title imagePath gallery category description location completionYear status progressPercentage highlights clientTestimonial createdAt updatedAt";

const parseHighlights = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
      }
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20);
    }
  }
  return [];
};

const parseExistingGallery = (raw: unknown): ProjectGalleryImage[] => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.url === "string")
      .map((item) => ({ url: item.url, publicId: item.publicId }))
      .slice(0, 20);
  } catch {
    return [];
  }
};

const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeDrafts = req.query.includeDrafts === "true" && isAdmin(req);

    if (includeDrafts) {
      const projects = await ProjectModel.find()
        .sort({ createdAt: -1 })
        .populate("sourceSite", "name city state status");
      res.status(HttpStatus.OK).json(projects);
      return;
    }

    const projects = await ProjectModel.find({ isPublished: true })
      .select(PUBLIC_PROJECT_FIELDS)
      .sort({ completionYear: -1, createdAt: -1 });
    res.status(HttpStatus.OK).json(projects);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (isAdmin(req)) {
      const project = await ProjectModel.findById(id).populate(
        "sourceSite",
        "name city state status",
      );
      if (!project) {
        throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(project);
      return;
    }

    const project = await ProjectModel.findOne({
      _id: id,
      isPublished: true,
    }).select(PUBLIC_PROJECT_FIELDS);
    if (!project) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(project);
  } catch (error) {
    next(error);
  }
};

const getProjectBySite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAdmin(req)) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const { siteId } = req.params;
    const project = await ProjectModel.findOne({ sourceSite: siteId });
    res.status(HttpStatus.OK).json(project || null);
  } catch (error) {
    next(error);
  }
};

const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAdmin(req)) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const {
      title,
      category,
      description,
      location,
      completionYear,
      status,
      progressPercentage,
      clientTestimonial,
      sourceSite,
      isPublished,
    } = req.body;

    if (!title || !category || !description) {
      throw new ApiError(
        "Title, category and description are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const coverFile = files?.image?.[0];
    const galleryFiles = files?.gallery || [];
    const existingGallery = parseExistingGallery(req.body.existingGallery);

    let imagePath = req.body.existingImagePath as string | undefined;
    let imagePublicId = req.body.existingImagePublicId as string | undefined;

    if (coverFile) {
      imagePath = coverFile.path;
      imagePublicId = coverFile.filename;
    }

    if (!imagePath) {
      throw new ApiError(
        "A cover image is required — upload one or select an existing site photo",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sourceSite) {
      const site = await SiteModel.findById(sourceSite);
      if (!site) {
        throw new ApiError("Source site not found", HttpStatus.NOT_FOUND);
      }
      const existing = await ProjectModel.findOne({ sourceSite });
      if (existing) {
        throw new ApiError(
          "This site has already been converted to a portfolio project",
          HttpStatus.CONFLICT,
        );
      }
    }

    const gallery: ProjectGalleryImage[] = [
      ...existingGallery,
      ...galleryFiles.map((file) => ({ url: file.path, publicId: file.filename })),
    ];

    const newProject = await ProjectModel.create({
      title: String(title).trim(),
      imagePath,
      imagePublicId,
      gallery,
      category: String(category).trim(),
      description: String(description).trim(),
      location: location ? String(location).trim() : "",
      completionYear: completionYear ? Number(completionYear) : undefined,
      status: status === "ongoing" ? "ongoing" : "completed",
      progressPercentage:
        progressPercentage !== undefined
          ? Math.min(100, Math.max(0, Number(progressPercentage)))
          : 100,
      highlights: parseHighlights(req.body.highlights),
      clientTestimonial: clientTestimonial ? String(clientTestimonial).trim() : undefined,
      sourceSite: sourceSite || undefined,
      isPublished: isPublished === "true" || isPublished === true,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    });

    res.status(HttpStatus.CREATED).json(newProject);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAdmin(req)) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const { id } = req.params;
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }

    const {
      title,
      category,
      description,
      location,
      completionYear,
      status,
      progressPercentage,
      clientTestimonial,
      isPublished,
    } = req.body;

    if (title !== undefined) project.title = String(title).trim();
    if (category !== undefined) project.category = String(category).trim();
    if (description !== undefined) project.description = String(description).trim();
    if (location !== undefined) project.location = String(location).trim();
    if (completionYear !== undefined) {
      project.completionYear = completionYear ? Number(completionYear) : undefined;
    }
    if (status !== undefined) {
      project.status = status === "ongoing" ? "ongoing" : "completed";
    }
    if (progressPercentage !== undefined) {
      project.progressPercentage = Math.min(
        100,
        Math.max(0, Number(progressPercentage)),
      );
    }
    if (clientTestimonial !== undefined) {
      project.clientTestimonial = String(clientTestimonial).trim();
    }
    if (req.body.highlights !== undefined) {
      project.highlights = parseHighlights(req.body.highlights);
    }
    if (isPublished !== undefined) {
      project.isPublished = isPublished === "true" || isPublished === true;
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const coverFile = files?.image?.[0];
    const galleryFiles = files?.gallery || [];

    if (coverFile) {
      const previousPublicId = project.imagePublicId;
      project.imagePath = coverFile.path;
      project.imagePublicId = coverFile.filename;
      if (previousPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId);
        } catch {
          // Non-fatal: stale asset can be cleaned up manually.
        }
      }
    } else if (req.body.existingImagePath) {
      project.imagePath = String(req.body.existingImagePath);
      project.imagePublicId = req.body.existingImagePublicId
        ? String(req.body.existingImagePublicId)
        : "";
    }

    if (req.body.existingGallery !== undefined || galleryFiles.length > 0) {
      const retainedGallery = parseExistingGallery(req.body.existingGallery);
      project.gallery = [
        ...retainedGallery,
        ...galleryFiles.map((file) => ({ url: file.path, publicId: file.filename })),
      ];
    }

    project.updatedBy = req.user?.userId as any;
    await project.save();

    res.status(HttpStatus.OK).json(project);
  } catch (error) {
    next(error);
  }
};

const setPublishStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAdmin(req)) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const { id } = req.params;
    const { isPublished } = req.body;

    const project = await ProjectModel.findByIdAndUpdate(
      id,
      { isPublished: !!isPublished, updatedBy: req.user?.userId },
      { new: true },
    );
    if (!project) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(project);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAdmin(req)) {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const { id } = req.params;
    const deletedProject = await ProjectModel.findByIdAndDelete(id);
    if (!deletedProject) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }

    const publicIdsToRemove = [
      deletedProject.imagePublicId,
      ...deletedProject.gallery
        .map((image) => image.publicId)
        .filter((publicId): publicId is string => !!publicId),
    ].filter(Boolean);

    await Promise.allSettled(
      publicIdsToRemove.map((publicId) => cloudinary.uploader.destroy(publicId)),
    );

    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export default {
  getProjects,
  getProjectById,
  getProjectBySite,
  createProject,
  updateProject,
  setPublishStatus,
  deleteProject,
};
