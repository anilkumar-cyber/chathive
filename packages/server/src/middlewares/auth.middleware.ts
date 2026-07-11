import { UserRole } from "@nexuschat/shared";
import { NextFunction, Request, Response } from "express";
import { User } from "../models";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { verifyAccessToken } from "../utils/tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
      isGuest?: boolean;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
}

export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized("Authentication required");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await User.findById(payload.sub).select("_id role isBanned isSuspended suspendedUntil isGuest");
  if (!user) throw ApiError.unauthorized("User no longer exists");
  if (user.isBanned) throw ApiError.forbidden("Account banned");
  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw ApiError.forbidden("Account suspended");
  }

  req.userId = user._id.toString();
  req.userRole = user.role;
  req.isGuest = user.isGuest;
  next();
});

export const blockGuests = (message = "Create a free account to use this feature") => (req: Request, _res: Response, next: NextFunction) => {
  if (req.isGuest) return next(ApiError.forbidden(message));
  next();
};

export const optionalAuthenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id role");
    if (user) {
      req.userId = user._id.toString();
      req.userRole = user.role;
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
});

export const authorize = (...roles: UserRole[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return next(ApiError.forbidden("Insufficient permissions"));
  }
  next();
};
