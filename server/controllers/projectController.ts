import { Request, Response, NextFunction } from "express";
import { ProjectModel } from "@models/Project";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";

const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await ProjectModel.find();
    res.status(HttpStatus.OK).json(projects);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(project);
  } catch (error) {
    next(error);
  }
};

const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, category, description } = req.body;
    // Check if file is uploaded (required for creation)
    if (!req.file) {
      throw new ApiError("Image file is required", HttpStatus.BAD_REQUEST);
    }
    const imagePath = req.file.path; // Path where Multer saved the file
    if (!title || !category || !description) {
      throw new ApiError("Missing required fields", HttpStatus.BAD_REQUEST);
    }
    const newProject = await ProjectModel.create({
      title,
      imagePath,
      category,
      description,
    });
    res.status(HttpStatus.CREATED).json(newProject);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, category, description } = req.body;
    // Construct updates object with text fields
    const updates: any = { title, category, description };
    // Update imagePath only if a new file is uploaded
    if (req.file) {
      updates.imagePath = req.file.path;
    }
    const updatedProject = await ProjectModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedProject) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedProject = await ProjectModel.findByIdAndDelete(id);
    if (!deletedProject) {
      throw new ApiError("Project not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};