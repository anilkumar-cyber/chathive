import { authenticator } from "otplib";
import QRCode from "qrcode";
import { Request, Response } from "express";
import { User } from "../models";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const registerFcmToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw ApiError.badRequest("FCM token is required");
  await User.findByIdAndUpdate(req.userId, { $addToSet: { fcmTokens: token } });
  sendSuccess(res, 200, null, "Push token registered.");
});

export const removeFcmToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  await User.findByIdAndUpdate(req.userId, { $pull: { fcmTokens: token } });
  sendSuccess(res, 200, null, "Push token removed.");
});

export const setup2FA = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");

  const secret = authenticator.generateSecret();
  user.twoFactorSecret = secret;
  user.twoFactorEnabled = false;
  await user.save();

  const otpauthUrl = authenticator.keyuri(user.email as string, "NexusChat", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  sendSuccess(res, 200, { secret, qrCodeDataUrl }, "Scan the QR code with your authenticator app, then confirm with a code.");
});

export const confirm2FA = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select("+twoFactorSecret");
  if (!user?.twoFactorSecret) throw ApiError.badRequest("Run setup first");

  const valid = authenticator.verify({ token: req.body.code, secret: user.twoFactorSecret });
  if (!valid) throw ApiError.badRequest("Invalid authentication code");

  user.twoFactorEnabled = true;
  await user.save();
  sendSuccess(res, 200, null, "Two-factor authentication enabled.");
});

export const disable2FA = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { twoFactorEnabled: false, twoFactorSecret: undefined });
  sendSuccess(res, 200, null, "Two-factor authentication disabled.");
});

export const getBlockedUsers = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).populate("blockedUsers", "username avatar");
  sendSuccess(res, 200, user?.blockedUsers ?? []);
});
