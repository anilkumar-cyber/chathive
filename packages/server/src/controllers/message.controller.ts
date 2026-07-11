import { MessageType, SocketEvents } from "@nexuschat/shared";
import { Request, Response } from "express";
import * as messageService from "../services/message.service";
import { uploadBuffer } from "../services/upload.service";
import { emitToUser } from "../sockets/io";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { catchAsync } from "../utils/catchAsync";

function inferMessageType(mimetype: string): MessageType {
  if (mimetype.startsWith("image/")) return MessageType.IMAGE;
  if (mimetype.startsWith("video/")) return MessageType.VIDEO;
  if (mimetype.startsWith("audio/")) return MessageType.AUDIO;
  return MessageType.DOCUMENT;
}

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { before, limit } = req.query as Record<string, string>;
  const messages = await messageService.getMessages(req.params.conversationId, req.userId as string, before, Number(limit) || 30);
  sendSuccess(res, 200, messages);
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { content, type, replyTo, mentions } = req.body;
  const { message, recipients } = await messageService.sendMessage({
    conversationId: req.params.conversationId,
    senderId: req.userId as string,
    content,
    type,
    replyTo,
    mentions,
  });

  recipients.forEach((id) => emitToUser(id, SocketEvents.MESSAGE_NEW, message));
  sendSuccess(res, 201, message);
});

export const uploadAttachmentMessage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");

  const type = inferMessageType(req.file.mimetype);
  const resourceType = type === MessageType.IMAGE ? "image" : type === MessageType.VIDEO ? "video" : "raw";
  const result = await uploadBuffer(req.file.buffer, "attachments", resourceType);

  const { message, recipients } = await messageService.sendMessage({
    conversationId: req.params.conversationId,
    senderId: req.userId as string,
    type,
    content: req.body.caption ?? "",
    attachments: [
      {
        url: result.url,
        type,
        fileName: req.file.originalname,
        fileSize: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        publicId: result.publicId,
      },
    ],
  });

  recipients.forEach((id) => emitToUser(id, SocketEvents.MESSAGE_NEW, message));
  sendSuccess(res, 201, message);
});

export const editMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await messageService.editMessage(req.params.id, req.userId as string, req.body.content);
  emitToUser(message.sender.toString(), SocketEvents.MESSAGE_EDITED, message);
  sendSuccess(res, 200, message);
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const forEveryone = req.query.forEveryone === "true";
  const message = await messageService.deleteMessage(req.params.id, req.userId as string, forEveryone);
  sendSuccess(res, 200, message);
});

export const reactToMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await messageService.reactToMessage(req.params.id, req.userId as string, req.body.emoji);
  sendSuccess(res, 200, message);
});

export const togglePinMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await messageService.togglePinMessage(req.params.id, req.userId as string);
  sendSuccess(res, 200, message);
});

export const searchMessages = catchAsync(async (req: Request, res: Response) => {
  const { q, page, limit } = req.query as Record<string, string>;
  if (!q) throw ApiError.badRequest("Query parameter 'q' is required");
  const result = await messageService.searchMessages(req.userId as string, q, page, limit);
  sendSuccess(res, 200, result);
});
