import { ReportStatus } from "@nexuschat/shared";
import { Request, Response } from "express";
import { AuditLog, BlockedWord, Conversation, Message, Report, User } from "../models";
import { invalidateProfanityCache } from "../services/profanity.service";
import { blockIp } from "../middlewares/security.middleware";
import { ApiError } from "../utils/ApiError";
import { paginate, sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

async function logAction(actor: string, action: string, meta?: Record<string, unknown>) {
  await AuditLog.create({ actor, action, meta });
}

export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, onlineUsers, totalMessages, totalGroups, totalRooms, pendingReports] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: { $ne: "offline" } }),
    Message.countDocuments(),
    Conversation.countDocuments({ type: "group" }),
    Conversation.countDocuments({ type: "room" }),
    Report.countDocuments({ status: ReportStatus.PENDING }),
  ]);
  sendSuccess(res, 200, { totalUsers, onlineUsers, totalMessages, totalGroups, totalRooms, pendingReports });
});

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  sendSuccess(res, 200, { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

export const banUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true, banReason: req.body.reason }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  await logAction(req.userId as string, "ban_user", { targetId: req.params.id, reason: req.body.reason });
  sendSuccess(res, 200, user, "User banned.");
});

export const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false, banReason: undefined }, { new: true });
  await logAction(req.userId as string, "unban_user", { targetId: req.params.id });
  sendSuccess(res, 200, user, "User unbanned.");
});

export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const { days = 7 } = req.body;
  const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true, suspendedUntil }, { new: true });
  await logAction(req.userId as string, "suspend_user", { targetId: req.params.id, days });
  sendSuccess(res, 200, user, "User suspended.");
});

export const unsuspendUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendedUntil: undefined }, { new: true });
  await logAction(req.userId as string, "unsuspend_user", { targetId: req.params.id });
  sendSuccess(res, 200, user, "User unsuspended.");
});

export const blockUserIp = catchAsync(async (req: Request, res: Response) => {
  blockIp(req.body.ip);
  await logAction(req.userId as string, "block_ip", { ip: req.body.ip });
  sendSuccess(res, 200, null, "IP blocked.");
});

export const listReports = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [items, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "username avatar")
      .populate("reportedUser", "username avatar")
      .populate("reportedMessage"),
    Report.countDocuments(filter),
  ]);
  sendSuccess(res, 200, { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

export const createReport = catchAsync(async (req: Request, res: Response) => {
  const report = await Report.create({ ...req.body, reportedBy: req.userId });
  sendSuccess(res, 201, report, "Report submitted.");
});

export const resolveReport = catchAsync(async (req: Request, res: Response) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, reviewedBy: req.userId },
    { new: true }
  );
  if (!report) throw ApiError.notFound("Report not found");
  sendSuccess(res, 200, report, "Report updated.");
});

export const listBlockedWords = catchAsync(async (_req: Request, res: Response) => {
  const words = await BlockedWord.find().sort({ word: 1 });
  sendSuccess(res, 200, words);
});

export const addBlockedWord = catchAsync(async (req: Request, res: Response) => {
  const word = await BlockedWord.create({ word: req.body.word });
  invalidateProfanityCache();
  sendSuccess(res, 201, word, "Blocked word added.");
});

export const removeBlockedWord = catchAsync(async (req: Request, res: Response) => {
  await BlockedWord.findByIdAndDelete(req.params.id);
  invalidateProfanityCache();
  sendSuccess(res, 200, null, "Blocked word removed.");
});

export const listRoomsAdmin = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const [items, total] = await Promise.all([
    Conversation.find({ type: "room" }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Conversation.countDocuments({ type: "room" }),
  ]);
  sendSuccess(res, 200, { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

export const deleteRoomAdmin = catchAsync(async (req: Request, res: Response) => {
  await Conversation.findOneAndDelete({ _id: req.params.id, type: "room" });
  await logAction(req.userId as string, "delete_room", { targetId: req.params.id });
  sendSuccess(res, 200, null, "Room deleted.");
});

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("actor", "username"),
    AuditLog.countDocuments(),
  ]);
  sendSuccess(res, 200, { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});
