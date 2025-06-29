import { Request, Response, NextFunction } from "express";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { logger } from "@utils/logger";

export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode =
    err instanceof ApiError ? err.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

  logger.error(`[${req.method}] ${req.url} - ${err.message} - ${statusCode}`);
  if (err.stack) {
    logger.error(`Stack: ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || "Something went wrong",
  });
};
