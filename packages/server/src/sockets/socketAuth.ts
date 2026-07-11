import { Socket } from "socket.io";
import { User } from "../models";
import { verifyAccessToken } from "../utils/tokens";

export interface AuthenticatedSocket extends Socket {
  userId: string;
}

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication token missing"));

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id isBanned isSuspended suspendedUntil");
    if (!user) return next(new Error("User not found"));
    if (user.isBanned) return next(new Error("Account banned"));
    if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
      return next(new Error("Account suspended"));
    }

    (socket as AuthenticatedSocket).userId = user._id.toString();
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
