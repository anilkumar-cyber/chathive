import { ConversationType, IConversation, IUserPublic } from "@nexuschat/shared";

export function getConversationDisplay(conversation: IConversation, currentUserId?: string): { name: string; avatar?: string; subtitle?: string } {
  if (conversation.type === ConversationType.PRIVATE) {
    const participants = (conversation.participants as IUserPublic[]) ?? [];
    const other = participants.find((p) => p._id !== currentUserId) ?? participants[0];
    return { name: other?.username ?? "Unknown", avatar: other?.avatar, subtitle: other?.status };
  }

  return {
    name: conversation.name ?? "Unnamed",
    avatar: conversation.avatar,
    subtitle: conversation.type === ConversationType.ROOM ? `#${conversation.category}` : `${(conversation.participants as unknown[])?.length ?? 0} members`,
  };
}

export function getOtherParticipant(conversation: IConversation, currentUserId?: string): IUserPublic | undefined {
  if (conversation.type !== ConversationType.PRIVATE) return undefined;
  const participants = (conversation.participants as IUserPublic[]) ?? [];
  return participants.find((p) => p._id !== currentUserId);
}

export function formatMessagePreview(conversation: IConversation): string {
  const msg = conversation.lastMessage;
  if (!msg) return "No messages yet";
  if (msg.isDeletedForEveryone) return "This message was deleted";
  if (msg.type !== "text") return `📎 ${msg.type}`;
  return msg.content || "";
}
