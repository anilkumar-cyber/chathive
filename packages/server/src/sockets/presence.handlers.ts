import { SocketEvents, UserStatus } from "@nexuschat/shared";
import { Server } from "socket.io";
import { User } from "../models";
import { getFriendIds } from "../services/friend.service";
import { userRoom } from "./io";
import { addSocket, isUserConnectedLocally, removeSocket } from "./presence";
import { AuthenticatedSocket } from "./socketAuth";

const OFFLINE_GRACE_MS = 5000;

export async function handleConnect(io: Server, socket: AuthenticatedSocket): Promise<void> {
  socket.join(userRoom(socket.userId));
  addSocket(socket.userId, socket.id);

  await User.findByIdAndUpdate(socket.userId, { status: UserStatus.ONLINE, lastSeen: new Date() });

  const friendIds = await getFriendIds(socket.userId);
  friendIds.forEach((id) => {
    io.to(userRoom(id.toString())).emit(SocketEvents.USER_ONLINE, { userId: socket.userId });
  });

  socket.on(SocketEvents.USER_STATUS_CHANGE, async (status: UserStatus) => {
    if (![UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.INVISIBLE].includes(status)) return;
    await User.findByIdAndUpdate(socket.userId, { status });
    const friends = await getFriendIds(socket.userId);
    friends.forEach((id) => io.to(userRoom(id.toString())).emit(SocketEvents.USER_STATUS_CHANGE, { userId: socket.userId, status }));
  });

  socket.on(SocketEvents.DISCONNECT, async () => {
    const remaining = removeSocket(socket.userId, socket.id);
    if (remaining > 0) return;

    setTimeout(async () => {
      if (isUserConnectedLocally(socket.userId)) return; // reconnected within grace period
      await User.findByIdAndUpdate(socket.userId, { status: UserStatus.OFFLINE, lastSeen: new Date() });
      const friends = await getFriendIds(socket.userId);
      friends.forEach((id) => io.to(userRoom(id.toString())).emit(SocketEvents.USER_OFFLINE, { userId: socket.userId }));
    }, OFFLINE_GRACE_MS);
  });
}
