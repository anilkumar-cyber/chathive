import { ConversationType, GroupRole, RoomCategory } from "@nexuschat/shared";
import { Types } from "mongoose";
import { Conversation } from "../models";
import { ApiError } from "../utils/ApiError";
import { paginate } from "../utils/ApiResponse";

export async function getOrCreatePrivateConversation(userA: string, userB: string) {
  if (userA === userB) throw ApiError.badRequest("Cannot start a conversation with yourself");

  let conversation = await Conversation.findOne({
    type: ConversationType.PRIVATE,
    participants: { $all: [userA, userB], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: ConversationType.PRIVATE,
      participants: [userA, userB],
    });
  }

  return conversation;
}

export async function listUserConversations(userId: string, type?: ConversationType) {
  const filter: Record<string, unknown> = {
    deletedBy: { $ne: userId },
    $or: [{ participants: userId }, { "members.user": userId }],
  };
  if (type) filter.type = type;

  return Conversation.find(filter)
    .populate("participants", "username avatar status lastSeen")
    .populate("lastMessage")
    .sort({ lastMessageAt: -1, updatedAt: -1 });
}

export async function createGroup(creatorId: string, name: string, description: string | undefined, memberIds: string[]) {
  const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));
  const members = uniqueMembers.map((user) => ({
    user: new Types.ObjectId(user),
    role: user === creatorId ? GroupRole.OWNER : GroupRole.MEMBER,
    joinedAt: new Date(),
  }));

  return Conversation.create({
    type: ConversationType.GROUP,
    name,
    description,
    createdBy: creatorId,
    participants: uniqueMembers,
    members,
  });
}

export async function requireGroupAdmin(conversationId: string, userId: string) {
  const conversation = await Conversation.findOne({ _id: conversationId, type: ConversationType.GROUP });
  if (!conversation) throw ApiError.notFound("Group not found");

  const member = conversation.members.find((m) => m.user.toString() === userId);
  if (!member || (member.role !== GroupRole.OWNER && member.role !== GroupRole.ADMIN)) {
    throw ApiError.forbidden("Admin privileges required");
  }
  return conversation;
}

export async function addGroupMembers(conversationId: string, requesterId: string, memberIds: string[]) {
  const conversation = await requireGroupAdmin(conversationId, requesterId);

  const existingIds = new Set(conversation.members.map((m) => m.user.toString()));
  const toAdd = memberIds.filter((id) => !existingIds.has(id));

  toAdd.forEach((id) => {
    conversation.members.push({ user: new Types.ObjectId(id), role: GroupRole.MEMBER, joinedAt: new Date() });
    conversation.participants.push(new Types.ObjectId(id));
  });

  await conversation.save();
  return conversation;
}

export async function removeGroupMember(conversationId: string, requesterId: string, targetUserId: string) {
  const conversation = await requireGroupAdmin(conversationId, requesterId);

  conversation.members = conversation.members.filter((m) => m.user.toString() !== targetUserId);
  conversation.participants = conversation.participants.filter((p) => p.toString() !== targetUserId);

  await conversation.save();
  return conversation;
}

export async function leaveGroup(conversationId: string, userId: string) {
  const conversation = await Conversation.findOne({ _id: conversationId, type: ConversationType.GROUP });
  if (!conversation) throw ApiError.notFound("Group not found");

  conversation.members = conversation.members.filter((m) => m.user.toString() !== userId);
  conversation.participants = conversation.participants.filter((p) => p.toString() !== userId);

  // Promote the earliest remaining member if the owner left
  const stillHasOwner = conversation.members.some((m) => m.role === GroupRole.OWNER);
  if (!stillHasOwner && conversation.members.length > 0) {
    conversation.members[0].role = GroupRole.OWNER;
  }

  await conversation.save();
  return conversation;
}

export async function updateGroup(conversationId: string, requesterId: string, updates: { name?: string; description?: string; avatar?: string }) {
  const conversation = await requireGroupAdmin(conversationId, requesterId);
  Object.assign(conversation, updates);
  await conversation.save();
  return conversation;
}

export async function createRoom(
  creatorId: string,
  name: string,
  description: string | undefined,
  category: RoomCategory,
  isPublic: boolean
) {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  return Conversation.create({
    type: ConversationType.ROOM,
    name,
    slug,
    description,
    category,
    isPublic,
    createdBy: creatorId,
    participants: [creatorId],
    members: [{ user: creatorId, role: GroupRole.OWNER, joinedAt: new Date() }],
  });
}

export async function listPublicRooms(category?: RoomCategory, q?: string, page?: string, limit?: string) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter: Record<string, unknown> = { type: ConversationType.ROOM, isPublic: true };
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    Conversation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
    Conversation.countDocuments(filter),
  ]);

  return { items, page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 };
}

export async function joinRoom(conversationId: string, userId: string) {
  const room = await Conversation.findOne({ _id: conversationId, type: ConversationType.ROOM });
  if (!room) throw ApiError.notFound("Room not found");
  if (!room.isPublic) throw ApiError.forbidden("This room is private");

  if (!room.participants.some((p) => p.toString() === userId)) {
    room.participants.push(new Types.ObjectId(userId));
    room.members.push({ user: new Types.ObjectId(userId), role: GroupRole.MEMBER, joinedAt: new Date() });
    await room.save();
  }
  return room;
}

export async function leaveRoom(conversationId: string, userId: string) {
  const room = await Conversation.findOne({ _id: conversationId, type: ConversationType.ROOM });
  if (!room) throw ApiError.notFound("Room not found");

  room.participants = room.participants.filter((p) => p.toString() !== userId);
  room.members = room.members.filter((m) => m.user.toString() !== userId);
  await room.save();
  return room;
}

export async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw ApiError.forbidden("You are not a participant of this conversation");

  return conversation;
}
