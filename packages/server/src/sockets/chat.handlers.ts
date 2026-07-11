import { SocketEvents } from "@nexuschat/shared";
import { Server } from "socket.io";
import { Conversation } from "../models";
import * as messageService from "../services/message.service";
import { ApiError } from "../utils/ApiError";
import { AuthenticatedSocket } from "./socketAuth";

function conversationRoom(id: string): string {
  return `conversation:${id}`;
}

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket): void {
  socket.on(SocketEvents.JOIN_CONVERSATION, async (conversationId: string, ack?: (ok: boolean) => void) => {
    try {
      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation || !conversation.participants.some((p) => p.toString() === socket.userId)) {
        return ack?.(false);
      }
      socket.join(conversationRoom(conversationId));
      ack?.(true);
    } catch {
      ack?.(false);
    }
  });

  socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: string) => {
    socket.leave(conversationRoom(conversationId));
  });

  socket.on(SocketEvents.JOIN_ROOM, (roomId: string) => {
    socket.join(conversationRoom(roomId));
  });

  socket.on(SocketEvents.LEAVE_ROOM, (roomId: string) => {
    socket.leave(conversationRoom(roomId));
  });

  socket.on(
    SocketEvents.MESSAGE_SEND,
    async (
      payload: { conversationId: string; content?: string; type?: string; replyTo?: string; mentions?: string[] },
      ack?: (result: { ok: boolean; message?: unknown; error?: string }) => void
    ) => {
      try {
        const { message, recipients } = await messageService.sendMessage({
          conversationId: payload.conversationId,
          senderId: socket.userId,
          content: payload.content,
          type: payload.type as never,
          replyTo: payload.replyTo,
          mentions: payload.mentions,
        });

        io.to(conversationRoom(payload.conversationId)).emit(SocketEvents.MESSAGE_NEW, message);
        recipients.forEach((id) => io.to(`user:${id}`).emit(SocketEvents.MESSAGE_NEW, message));

        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: (err as ApiError).message ?? "Failed to send message" });
      }
    }
  );

  socket.on(SocketEvents.TYPING_START, (conversationId: string) => {
    socket.to(conversationRoom(conversationId)).emit(SocketEvents.TYPING_START, { conversationId, userId: socket.userId });
  });

  socket.on(SocketEvents.TYPING_STOP, (conversationId: string) => {
    socket.to(conversationRoom(conversationId)).emit(SocketEvents.TYPING_STOP, { conversationId, userId: socket.userId });
  });

  socket.on(SocketEvents.MESSAGE_DELIVERED, async ({ messageId }: { messageId: string }) => {
    await messageService.markDelivered(messageId, socket.userId);
    io.emit(SocketEvents.MESSAGE_DELIVERED, { messageId, userId: socket.userId });
  });

  socket.on(SocketEvents.MESSAGE_SEEN, async ({ conversationId }: { conversationId: string }) => {
    await messageService.markSeen(conversationId, socket.userId);
    io.to(conversationRoom(conversationId)).emit(SocketEvents.MESSAGE_SEEN, { conversationId, userId: socket.userId });
  });

  socket.on(SocketEvents.MESSAGE_EDIT, async ({ messageId, content }: { messageId: string; content: string }) => {
    try {
      const message = await messageService.editMessage(messageId, socket.userId, content);
      io.to(conversationRoom(message.conversation.toString())).emit(SocketEvents.MESSAGE_EDITED, message);
    } catch {
      // no-op: invalid edit attempts are ignored client-side via REST error path
    }
  });

  socket.on(SocketEvents.MESSAGE_DELETE, async ({ messageId, forEveryone }: { messageId: string; forEveryone: boolean }) => {
    try {
      const message = await messageService.deleteMessage(messageId, socket.userId, forEveryone);
      io.to(conversationRoom(message.conversation.toString())).emit(SocketEvents.MESSAGE_DELETED, {
        messageId,
        forEveryone,
      });
    } catch {
      // ignore
    }
  });

  socket.on(SocketEvents.MESSAGE_REACT, async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    try {
      const message = await messageService.reactToMessage(messageId, socket.userId, emoji);
      io.to(conversationRoom(message.conversation.toString())).emit(SocketEvents.MESSAGE_REACTED, message);
    } catch {
      // ignore
    }
  });

  socket.on(SocketEvents.MESSAGE_PIN, async ({ messageId }: { messageId: string }) => {
    try {
      const message = await messageService.togglePinMessage(messageId, socket.userId);
      io.to(conversationRoom(message.conversation.toString())).emit(SocketEvents.MESSAGE_PINNED, message);
    } catch {
      // ignore
    }
  });
}
