import { Request, Response } from "express";
import { authenticator } from "otplib";
import { isProd } from "../config/env";
import { User } from "../models";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string, rememberMe?: boolean, maxAgeMsOverride?: number): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: maxAgeMsOverride ?? (rememberMe ? 90 : 30) * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const user = await authService.registerUser(username, email, password);
  sendSuccess(res, 201, { userId: user._id, email: user.email }, "Registration successful. Please verify your email.");
});

export const guestLogin = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.createGuestUser(req.body.username);
  const meta = authService.extractClientMeta(req);
  const tokens = await authService.issueTokenPair(user, { ...meta, ttlOverride: authService.GUEST_SESSION_TTL });

  setRefreshCookie(res, tokens.refreshToken, false, 24 * 60 * 60 * 1000);
  sendSuccess(res, 201, { accessToken: tokens.accessToken, user }, "Welcome! You're chatting as a guest.");
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmailToken(req.body.token);
  sendSuccess(res, 200, null, "Email verified successfully.");
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { emailOrUsername, password, rememberMe, twoFactorCode } = req.body;
  const user = await authService.authenticateCredentials(emailOrUsername, password);

  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      return sendSuccess(res, 200, { requiresTwoFactor: true }, "Enter your two-factor authentication code.");
    }
    const valid = authenticator.verify({ token: twoFactorCode, secret: user.twoFactorSecret as string });
    if (!valid) throw ApiError.unauthorized("Invalid two-factor authentication code");
  }

  const meta = authService.extractClientMeta(req);
  const tokens = await authService.issueTokenPair(user, { ...meta, rememberMe });

  setRefreshCookie(res, tokens.refreshToken, rememberMe);
  sendSuccess(res, 200, { accessToken: tokens.accessToken, user }, "Login successful.");
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  const meta = authService.extractClientMeta(req);
  const tokens = await authService.rotateRefreshToken(token, meta);

  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, 200, { accessToken: tokens.accessToken }, "Token refreshed.");
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (token) await authService.revokeRefreshFamily(token);

  if (req.userId) {
    await User.findByIdAndUpdate(req.userId, { status: "offline", lastSeen: new Date() });
  }

  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  sendSuccess(res, 200, null, "Logged out.");
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  sendSuccess(res, 200, null, "If that email exists, a reset link has been sent.");
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, 200, null, "Password reset successfully. Please log in.");
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, user);
});

export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as InstanceType<typeof User>;
  const meta = authService.extractClientMeta(req);
  const tokens = await authService.issueTokenPair(user, meta);

  setRefreshCookie(res, tokens.refreshToken);
  const redirectUrl = `${req.query.state ?? ""}`;
  res.redirect(
    `${process.env.CLIENT_URL || "http://localhost:5173"}/oauth/callback?accessToken=${tokens.accessToken}${
      redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ""
    }`
  );
});
