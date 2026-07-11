import { MessageStatus, MessageType, NotificationType } from "@nexuschat/shared";
import { Types } from "mongoose";
import { Conversation, Message } from "../models";
import { IAttachmentSub } from "../models/Message.model";
import { ApiError } from "../utils/ApiError";
import { paginate } from "../utils/ApiResponse";
import { containsProfanity, censorText } from "./profanity.service";
import { createNotification } from "./notification.service";
import { assertParticipant } from "./conversation.service";

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  type?: MessageType;
  content?: string;
  attachments?: IAttachmentSub[];
  replyTo?: string;
  forwardedFrom?: string;
  mentions?: string[];
}

export async function sendMessage(input: SendMessageInput) {
  const conversation = await assertParticipant(input.conversationId, input.senderId);

  let content = input.content?.trim() ?? "";
  if (content && (await containsProfanity(content))) {
    content = await censorText(content);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: input.senderId,
    type: input.type ?? MessageType.TEXT,
    content,
    attachments: input.attachments ?? [],
    replyTo: input.replyTo,
    forwardedFrom: input.forwardedFrom,
    mentions: input.mentions ?? [],
    status: MessageStatus.SENT,
    deliveredTo: [input.senderId],
    seenBy: [input.senderId],
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const populated = await message.populate([
    { path: "sender", select: "username avatar" },
    { path: "replyTo" },
  ]);

  const recipients = conversation.participants.map((p) => p.toString()).filter((id) => id !== input.senderId);
  await Promise.all(
    (input.mentions ?? [])
      .filter((id) => recipients.includes(id))
      .map((id) =>
        createNotification({
          recipient: id,
          sender: input.senderId,
          type: NotificationType.MENTION,
          content: "mentioned you in a message",
          link: `/chat/${conversation._id}`,
        })
      )
  );

  return { message: populated, conversation, recipients };
}

export async function getMessages(conversationId: string, userId: string, before?: string, limit = 30) {
  await assertParticipant(conversationId, userId);

  const filter: Record<string, unknown> = { conversation: conversationId, deletedFor: { $ne: userId } };
  if (before) filter._id = { $lt: before };

  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("sender", "username avatar")
    .populate("replyTo");

  return messages.reverse();
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");
  if (message.sender.toString() !== userId) throw ApiError.forbidden("You can only edit your own messages");
  if (message.isDeletedForEveryone) throw ApiError.badRequest("Cannot edit a deleted message");

  message.editHistory.push({ content: message.content, editedAt: new Date() });
  message.content = (await containsProfanity(content)) ? await censorText(content) : content;
  message.isEdited = true;
  await message.save();

  return message.populate("sender", "username avatar");
}

export async function deleteMessage(messageId: string, userId: string, forEveryone: boolean) {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");

  if (forEveryone) {
    if (message.sender.toString() !== userId) throw ApiError.forbidden("You can only delete your own messages for everyone");
    message.isDeletedForEveryone = true;
    message.content = "";
    message.attachments = [];
  } else {
    if (!message.deletedFor.some((id) => id.toString() === userId)) {
      message.deletedFor.push(new Types.ObjectId(userId));
    }
  }

  await message.save();
  return message;
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");

  const existingIndex = message.reactions.findIndex((r) => r.user.toString() === userId && r.emoji === emoji);
  if (existingIndex >= 0) {
    message.reactions.splice(existingIndex, 1);
  } else {
    message.reactions = message.reactions.filter((r) => r.user.toString() !== userId);
    message.reactions.push({ emoji, user: new Types.ObjectId(userId) });
  }

  await message.save();
  return message;
}

export async function togglePinMessage(messageId: string, userId: string) {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");
  await assertParticipant(message.conversation.toString(), userId);

  message.isPinned = !message.isPinned;
  await message.save();

  if (message.isPinned) {
    await Conversation.updateOne({ _id: message.conversation }, { $addToSet: { pinnedMessages: message._id } });
  } else {
    await Conversation.updateOne({ _id: message.conversation }, { $pull: { pinnedMessages: message._id } });
  }

  return message;
}

export async function markDelivered(messageId: string, userId: string) {
  await Message.updateOne(
    { _id: messageId },
    { $addToSet: { deliveredTo: userId }, $set: { status: MessageStatus.DELIVERED } }
  );
}

export async function markSeen(conversationId: string, userId: string) {
  await Message.updateMany(
    { conversation: conversationId, seenBy: { $ne: userId } },
    { $addToSet: { seenBy: userId, deliveredTo: userId }, $set: { status: MessageStatus.READ } }
  );
}

export async function searchMessages(userId: string, q: string, page?: string, limit?: string) {
  const { page: p, limit: l, skip } = paginate(page, limit);

  const conversations = await Conversation.find({
    $or: [{ participants: userId }, { "members.user": userId }],
  }).select("_id");
  const conversationIds = conversations.map((c) => c._id);

  const filter = { conversation: { $in: conversationIds }, $text: { $search: q }, deletedFor: { $ne: userId } };
  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).populate("sender", "username avatar"),
    Message.countDocuments(filter),
  ]);

  return { items, page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 };
}
