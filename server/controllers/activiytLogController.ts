import { Request, Response, NextFunction } from "express";
import { ActivityLogModel } from "@models/ActivityLog";
import { UserRole } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user.role !== UserRole.CompanyAdmin) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const logs = await ActivityLogModel.find().populate("user resourceId");
    res.status(HttpStatus.OK).json(logs);
  } catch (error) {
    next(error);
  }
};

export default { getActivityLogs };