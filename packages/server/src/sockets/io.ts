import { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIO(io: Server): void {
  ioInstance = io;
}

export function getIO(): Server {
  if (!ioInstance) throw new Error("Socket.io not initialized yet");
  return ioInstance;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!ioInstance) return;
  ioInstance.to(userRoom(userId)).emit(event, payload);
}
