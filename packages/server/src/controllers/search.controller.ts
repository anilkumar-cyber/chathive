import { ConversationType, RoomCategory } from "@nexuschat/shared";
import { Request, Response } from "express";
import * as conversationService from "../services/conversation.service";
import * as messageService from "../services/message.service";
import * as userService from "../services/user.service";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

export const globalSearch = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? "";
  const userId = req.userId as string;

  const [users, messages, rooms] = await Promise.all([
    q ? userService.searchUsers({ q, excludeId: userId, limit: "5" }) : Promise.resolve({ items: [] }),
    q ? messageService.searchMessages(userId, q, "1", "5") : Promise.resolve({ items: [] }),
    q ? conversationService.listPublicRooms(undefined, q, "1", "5") : Promise.resolve({ items: [] }),
  ]);

  sendSuccess(res, 200, { users: users.items, messages: messages.items, rooms: rooms.items });
});

export const searchGroups = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? "";
  const result = await conversationService.listUserConversations(req.userId as string, ConversationType.GROUP);
  const filtered = q ? result.filter((g) => g.name?.toLowerCase().includes(q.toLowerCase())) : result;
  sendSuccess(res, 200, filtered);
});

export const searchRooms = catchAsync(async (req: Request, res: Response) => {
  const { q, category, page, limit } = req.query as Record<string, string>;
  const result = await conversationService.listPublicRooms(category as RoomCategory, q, page, limit);
  sendSuccess(res, 200, result);
});
