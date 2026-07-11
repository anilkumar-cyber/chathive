import { ConversationType } from "@nexuschat/shared";
import { Request, Response } from "express";
import { Conversation } from "../models";
import * as conversationService from "../services/conversation.service";
import { uploadBuffer } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const listConversations = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as ConversationType | undefined;
  const conversations = await conversationService.listUserConversations(req.userId as string, type);
  sendSuccess(res, 200, conversations);
});

export const getConversation = catchAsync(async (req: Request, res: Response) => {
  const conversation = await conversationService.assertParticipant(req.params.id, req.userId as string);
  await conversation.populate("participants", "username avatar status lastSeen");
  sendSuccess(res, 200, conversation);
});

export const startPrivateConversation = catchAsync(async (req: Request, res: Response) => {
  const conversation = await conversationService.getOrCreatePrivateConversation(req.userId as string, req.params.userId);
  await conversation.populate("participants", "username avatar status lastSeen");
  sendSuccess(res, 201, conversation);
});

export const createGroup = catchAsync(async (req: Request, res: Response) => {
  const { name, description, memberIds } = req.body;
  const group = await conversationService.createGroup(req.userId as string, name, description, memberIds);
  await group.populate("participants", "username avatar status");
  sendSuccess(res, 201, group, "Group created.");
});

export const updateGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await conversationService.updateGroup(req.params.id, req.userId as string, req.body);
  sendSuccess(res, 200, group, "Group updated.");
});

export const uploadGroupAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");
  await conversationService.requireGroupAdmin(req.params.id, req.userId as string);
  const result = await uploadBuffer(req.file.buffer, "group-avatars", "image");
  const group = await Conversation.findByIdAndUpdate(req.params.id, { avatar: result.url }, { new: true });
  sendSuccess(res, 200, group, "Group avatar updated.");
});

export const addMembers = catchAsync(async (req: Request, res: Response) => {
  const group = await conversationService.addGroupMembers(req.params.id, req.userId as string, req.body.memberIds);
  sendSuccess(res, 200, group, "Members added.");
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const group = await conversationService.removeGroupMember(req.params.id, req.userId as string, req.params.userId);
  sendSuccess(res, 200, group, "Member removed.");
});

export const leaveGroup = catchAsync(async (req: Request, res: Response) => {
  const group = await conversationService.leaveGroup(req.params.id, req.userId as string);
  sendSuccess(res, 200, group, "Left group.");
});

export const createRoom = catchAsync(async (req: Request, res: Response) => {
  const { name, description, category, isPublic } = req.body;
  const room = await conversationService.createRoom(req.userId as string, name, description, category, isPublic);
  sendSuccess(res, 201, room, "Room created.");
});

export const listRooms = catchAsync(async (req: Request, res: Response) => {
  const { category, q, page, limit } = req.query as Record<string, string>;
  const result = await conversationService.listPublicRooms(category as never, q, page, limit);
  sendSuccess(res, 200, result);
});

export const joinRoom = catchAsync(async (req: Request, res: Response) => {
  const room = await conversationService.joinRoom(req.params.id, req.userId as string);
  sendSuccess(res, 200, room, "Joined room.");
});

export const leaveRoom = catchAsync(async (req: Request, res: Response) => {
  await conversationService.leaveRoom(req.params.id, req.userId as string);
  sendSuccess(res, 200, null, "Left room.");
});

export const archiveConversation = catchAsync(async (req: Request, res: Response) => {
  await Conversation.findByIdAndUpdate(req.params.id, { $addToSet: { archivedBy: req.userId } });
  sendSuccess(res, 200, null, "Conversation archived.");
});

export const deleteConversationForMe = catchAsync(async (req: Request, res: Response) => {
  await Conversation.findByIdAndUpdate(req.params.id, { $addToSet: { deletedBy: req.userId } });
  sendSuccess(res, 200, null, "Conversation removed.");
});

export const muteConversation = catchAsync(async (req: Request, res: Response) => {
  await Conversation.findByIdAndUpdate(req.params.id, { $addToSet: { mutedBy: req.userId } });
  sendSuccess(res, 200, null, "Conversation muted.");
});

export const unmuteConversation = catchAsync(async (req: Request, res: Response) => {
  await Conversation.findByIdAndUpdate(req.params.id, { $pull: { mutedBy: req.userId } });
  sendSuccess(res, 200, null, "Conversation unmuted.");
});
