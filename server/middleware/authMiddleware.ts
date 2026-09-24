import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { Messages } from "@utils/enums/messages";
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
      sessionId?: string;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    const user = await UserModel.findById(req.user.userId);
    if (!user || user.isBlocked) {
      next(new ApiError("User is blocked", HttpStatus.CONFLICT));
      return;
    }
    if (user.isDeleted) {
      next(
        new ApiError(
          "This account has been deactivated. Please contact your administrator.",
          HttpStatus.FORBIDDEN
        )
      );
      return;
    }
    if (
      decoded.sessionId &&
      !user.sessions.some(
        (session) => session._id.toString() === decoded.sessionId
      )
    ) {
      next(new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
      return;
    }

    req.authUser = user;

    next();
  } catch (error) {
    next(new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED));
  }
};

export const requireRoles = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(Messages.TOKEN_MISSING, HttpStatus.UNAUTHORIZED));
      return;
    }

    const userRole = req.user.role;
    const hasRole = allowedRoles.some(
      (role) => role === userRole || String(role).toLowerCase() === String(userRole).toLowerCase()
    );

    if (!hasRole) {
      next(
        new ApiError(
          "Access forbidden: you do not have permission to perform this action",
          HttpStatus.FORBIDDEN
        )
      );
      return;
    }

    next();
  };
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.accessToken;
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
      sessionId?: string;
    };
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };
  } catch (error) {
    // Invalid/expired token on an optional-auth route: proceed as anonymous.
  }
  next();
};