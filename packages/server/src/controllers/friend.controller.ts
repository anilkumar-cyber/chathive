import { FriendRequestStatus, NotificationType, SocketEvents } from "@nexuschat/shared";
import { Request, Response } from "express";
import { FriendRequest, User } from "../models";
import { createNotification } from "../services/notification.service";
import { emitToUser } from "../sockets/io";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const sendRequest = catchAsync(async (req: Request, res: Response) => {
  const { userId: to } = req.params;
  const from = req.userId as string;

  if (from === to) throw ApiError.badRequest("You cannot friend yourself");

  const target = await User.findById(to);
  if (!target) throw ApiError.notFound("User not found");

  const existing = await FriendRequest.findOne({
    $or: [
      { from, to },
      { from: to, to: from },
    ],
  });
  if (existing) {
    if (existing.status === FriendRequestStatus.ACCEPTED) throw ApiError.conflict("Already friends");
    if (existing.status === FriendRequestStatus.PENDING) throw ApiError.conflict("Friend request already pending");
  }

  const request = existing
    ? await FriendRequest.findByIdAndUpdate(existing._id, { from, to, status: FriendRequestStatus.PENDING }, { new: true })
    : await FriendRequest.create({ from, to });

  await createNotification({
    recipient: to,
    sender: from,
    type: NotificationType.FRIEND_REQUEST,
    content: "sent you a friend request",
    link: "/friends/requests",
  });

  sendSuccess(res, 201, request, "Friend request sent.");
});

export const acceptRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await FriendRequest.findOne({ _id: req.params.requestId, to: req.userId });
  if (!request) throw ApiError.notFound("Friend request not found");
  if (request.status !== FriendRequestStatus.PENDING) throw ApiError.badRequest("Request already resolved");

  request.status = FriendRequestStatus.ACCEPTED;
  await request.save();

  await createNotification({
    recipient: request.from.toString(),
    sender: req.userId,
    type: NotificationType.FRIEND_ACCEPT,
    content: "accepted your friend request",
    link: `/profile/${req.userId}`,
  });

  emitToUser(request.from.toString(), SocketEvents.FRIEND_REQUEST_ACCEPTED, { requestId: request._id, by: req.userId });

  sendSuccess(res, 200, request, "Friend request accepted.");
});

export const rejectRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await FriendRequest.findOne({ _id: req.params.requestId, to: req.userId });
  if (!request) throw ApiError.notFound("Friend request not found");

  request.status = FriendRequestStatus.REJECTED;
  await request.save();
  sendSuccess(res, 200, request, "Friend request rejected.");
});

export const cancelRequest = catchAsync(async (req: Request, res: Response) => {
  await FriendRequest.findOneAndDelete({ _id: req.params.requestId, from: req.userId, status: FriendRequestStatus.PENDING });
  sendSuccess(res, 200, null, "Friend request cancelled.");
});

export const removeFriend = catchAsync(async (req: Request, res: Response) => {
  const { userId: otherId } = req.params;
  await FriendRequest.findOneAndDelete({
    status: FriendRequestStatus.ACCEPTED,
    $or: [
      { from: req.userId, to: otherId },
      { from: otherId, to: req.userId },
    ],
  });
  sendSuccess(res, 200, null, "Friend removed.");
});

export const listFriends = catchAsync(async (req: Request, res: Response) => {
  const requests = await FriendRequest.find({
    status: FriendRequestStatus.ACCEPTED,
    $or: [{ from: req.userId }, { to: req.userId }],
  })
    .populate("from", "username avatar status lastSeen")
    .populate("to", "username avatar status lastSeen");

  const friends = requests.map((r) => (r.from._id.toString() === req.userId ? r.to : r.from));
  sendSuccess(res, 200, friends);
});

export const listPendingRequests = catchAsync(async (req: Request, res: Response) => {
  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: req.userId, status: FriendRequestStatus.PENDING }).populate("from", "username avatar"),
    FriendRequest.find({ from: req.userId, status: FriendRequestStatus.PENDING }).populate("to", "username avatar"),
  ]);
  sendSuccess(res, 200, { incoming, outgoing });
});
