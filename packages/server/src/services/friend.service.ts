import { FriendRequestStatus } from "@nexuschat/shared";
import { Types } from "mongoose";
import { FriendRequest } from "../models";

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  const req = await FriendRequest.findOne({
    status: FriendRequestStatus.ACCEPTED,
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA },
    ],
  });
  return Boolean(req);
}

export async function getFriendIds(userId: string): Promise<Types.ObjectId[]> {
  const requests = await FriendRequest.find({
    status: FriendRequestStatus.ACCEPTED,
    $or: [{ from: userId }, { to: userId }],
  });
  return requests.map((r) => (r.from.toString() === userId ? r.to : r.from));
}
