import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { Messages } from "@utils/enums/messages";
import { decode } from "punycode";
import { UserRole } from "@entities/user";
import { UserModel } from "@models/User";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.accessToken;

  if (!token) {
    next(new ApiError(Messages.TOKEN_MISSING, HttpStatus.UNAUTHORIZED));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    
    const user = await UserModel.findById(req.user.userId);
    if (!user || user.isBlocked) {
      next(new ApiError("User is blocked", HttpStatus.CONFLICT));
      return;
    }
    
    next();
  } catch (error) {
    next(new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
  }
};
