import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { isProd } from "../config/env";
import { logger } from "../config/logger";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
    apiError = ApiError.badRequest("Validation failed", errors);
  } else if (err instanceof mongoose.Error.CastError) {
    apiError = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  } else if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue || {};
    apiError = ApiError.conflict(`Duplicate value for: ${Object.keys(keyValue).join(", ")}`);
  } else if (err instanceof Error) {
    apiError = new ApiError(500, isProd ? "Internal server error" : err.message);
  } else {
    apiError = ApiError.internal();
  }

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${apiError.message}`, { stack: (err as Error)?.stack });
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors,
    ...(isProd ? {} : { stack: (err as Error)?.stack }),
  });
}
