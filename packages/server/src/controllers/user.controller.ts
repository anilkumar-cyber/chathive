import { Request, Response } from "express";
import { User } from "../models";
import * as userService from "../services/user.service";
import { deleteAsset, uploadBuffer } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const allowed = [
    "username",
    "bio",
    "age",
    "gender",
    "country",
    "state",
    "city",
    "languages",
    "interests",
    "profession",
    "customStatus",
    "profilePrivacy",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, user, "Profile updated.");
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.userId, { status: req.body.status }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, user);
});

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");
  const result = await uploadBuffer(req.file.buffer, "avatars", "image");

  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");

  user.avatar = result.url;
  await user.save();
  sendSuccess(res, 200, { avatar: result.url }, "Avatar updated.");
});

export const uploadCoverPhoto = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");
  const result = await uploadBuffer(req.file.buffer, "covers", "image");

  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");

  user.coverPhoto = result.url;
  await user.save();
  sendSuccess(res, 200, { coverPhoto: result.url }, "Cover photo updated.");
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, 200, user);
});

export const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.searchUsers({ ...req.query, excludeId: req.userId } as Record<string, string>);
  sendSuccess(res, 200, result);
});

export const getOnlineUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.getOnlineUsers();
  sendSuccess(res, 200, users);
});

export const getRecentlyJoined = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.getRecentlyJoined();
  sendSuccess(res, 200, users);
});

export const blockUser = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $addToSet: { blockedUsers: req.params.id } });
  sendSuccess(res, 200, null, "User blocked.");
});

export const unblockUser = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { blockedUsers: req.params.id } });
  sendSuccess(res, 200, null, "User unblocked.");
});

export const muteUser = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $addToSet: { mutedUsers: req.params.id } });
  sendSuccess(res, 200, null, "User muted.");
});

export const unmuteUser = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { mutedUsers: req.params.id } });
  sendSuccess(res, 200, null, "User unmuted.");
});

export const addBestFriend = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $addToSet: { bestFriends: req.params.id } });
  sendSuccess(res, 200, null, "Added to best friends.");
});

export const removeBestFriend = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { bestFriends: req.params.id } });
  sendSuccess(res, 200, null, "Removed from best friends.");
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.avatar) await deleteAsset(user.avatar).catch(() => undefined);
  await User.findByIdAndDelete(req.userId);
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  sendSuccess(res, 200, null, "Account deleted.");
});

export const downloadMyData = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  res.setHeader("Content-Disposition", "attachment; filename=nexuschat-data.json");
  res.json({ user });
});
