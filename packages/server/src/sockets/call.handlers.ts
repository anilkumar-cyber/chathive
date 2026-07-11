import { SocketEvents } from "@nexuschat/shared";
import { Server } from "socket.io";
import { emitToUser } from "./io";
import { AuthenticatedSocket } from "./socketAuth";

/**
 * Phase 2: WebRTC signaling relay only (offer/answer/ICE candidates pass through
 * the server; media stays peer-to-peer). No call state is persisted here yet.
 */
export function registerCallHandlers(_io: Server, socket: AuthenticatedSocket): void {
  socket.on(SocketEvents.CALL_INVITE, (payload: { to: string; conversationId: string; isVideo: boolean }) => {
    emitToUser(payload.to, SocketEvents.CALL_INVITE, { ...payload, from: socket.userId });
  });

  socket.on(SocketEvents.CALL_ACCEPT, (payload: { to: string; conversationId: string }) => {
    emitToUser(payload.to, SocketEvents.CALL_ACCEPT, { ...payload, from: socket.userId });
  });

  socket.on(SocketEvents.CALL_REJECT, (payload: { to: string; conversationId: string }) => {
    emitToUser(payload.to, SocketEvents.CALL_REJECT, { ...payload, from: socket.userId });
  });

  socket.on(SocketEvents.CALL_END, (payload: { to: string; conversationId: string }) => {
    emitToUser(payload.to, SocketEvents.CALL_END, { ...payload, from: socket.userId });
  });

  socket.on(SocketEvents.CALL_SIGNAL, (payload: { to: string; data: unknown }) => {
    emitToUser(payload.to, SocketEvents.CALL_SIGNAL, { data: payload.data, from: socket.userId });
  });
}
