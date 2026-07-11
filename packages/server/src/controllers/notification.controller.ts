import { Request, Response } from "express";
import { Notification } from "../models";
import { paginate } from "../utils/ApiResponse";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sender", "username avatar"),
    Notification.countDocuments({ recipient: req.userId }),
    Notification.countDocuments({ recipient: req.userId, isRead: false }),
  ]);
  sendSuccess(res, 200, { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1, unreadCount });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.userId }, { isRead: true });
  sendSuccess(res, 200, null, "Marked as read.");
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
  sendSuccess(res, 200, null, "All notifications marked as read.");
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.userId });
  sendSuccess(res, 200, null, "Notification deleted.");
});
