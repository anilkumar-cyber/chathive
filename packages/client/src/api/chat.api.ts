import { ConversationType, IApiResponse, IConversation, IMessage, IPaginated, RoomCategory } from "@nexuschat/shared";
import { api } from "@/lib/api";

export async function listConversations(type?: ConversationType) {
  const { data } = await api.get<IApiResponse<IConversation[]>>("/conversations", { params: { type } });
  return data.data ?? [];
}

export async function getConversation(id: string) {
  const { data } = await api.get<IApiResponse<IConversation>>(`/conversations/${id}`);
  return data.data as IConversation;
}

export async function startPrivateConversation(userId: string) {
  const { data } = await api.post<IApiResponse<IConversation>>(`/conversations/private/${userId}`);
  return data.data as IConversation;
}

export async function createGroup(name: string, memberIds: string[], description?: string) {
  const { data } = await api.post<IApiResponse<IConversation>>("/conversations/groups", { name, description, memberIds });
  return data.data as IConversation;
}

export async function addGroupMembers(groupId: string, memberIds: string[]) {
  const { data } = await api.post<IApiResponse<IConversation>>(`/conversations/groups/${groupId}/members`, { memberIds });
  return data.data as IConversation;
}

export async function removeGroupMember(groupId: string, userId: string) {
  await api.delete(`/conversations/groups/${groupId}/members/${userId}`);
}

export async function leaveGroup(groupId: string) {
  await api.post(`/conversations/groups/${groupId}/leave`);
}

export async function createRoom(name: string, category: RoomCategory, description?: string, isPublic = true) {
  const { data } = await api.post<IApiResponse<IConversation>>("/conversations/rooms", { name, category, description, isPublic });
  return data.data as IConversation;
}

export async function listRooms(category?: string, q?: string, page = 1) {
  const { data } = await api.get<IApiResponse<IPaginated<IConversation>>>("/conversations/rooms", {
    params: { category, q, page },
  });
  return data.data as IPaginated<IConversation>;
}

export async function joinRoom(roomId: string) {
  const { data } = await api.post<IApiResponse<IConversation>>(`/conversations/rooms/${roomId}/join`);
  return data.data as IConversation;
}

export async function leaveRoom(roomId: string) {
  await api.post(`/conversations/rooms/${roomId}/leave`);
}

export async function getMessages(conversationId: string, before?: string) {
  const { data } = await api.get<IApiResponse<IMessage[]>>(`/conversations/${conversationId}/messages`, {
    params: { before, limit: 30 },
  });
  return data.data ?? [];
}

export async function sendMessage(conversationId: string, content: string, replyTo?: string, mentions?: string[]) {
  const { data } = await api.post<IApiResponse<IMessage>>(`/conversations/${conversationId}/messages`, {
    content,
    replyTo,
    mentions,
  });
  return data.data as IMessage;
}

export async function sendAttachment(conversationId: string, file: File, caption?: string, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);

  const { data } = await api.post<IApiResponse<IMessage>>(`/conversations/${conversationId}/messages/attachment`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return data.data as IMessage;
}

export async function editMessage(messageId: string, content: string) {
  const { data } = await api.patch<IApiResponse<IMessage>>(`/messages/${messageId}`, { content });
  return data.data as IMessage;
}

export async function deleteMessage(messageId: string, forEveryone: boolean) {
  await api.delete(`/messages/${messageId}`, { params: { forEveryone } });
}

export async function reactToMessage(messageId: string, emoji: string) {
  const { data } = await api.post<IApiResponse<IMessage>>(`/messages/${messageId}/react`, { emoji });
  return data.data as IMessage;
}

export async function togglePinMessage(messageId: string) {
  const { data } = await api.post<IApiResponse<IMessage>>(`/messages/${messageId}/pin`);
  return data.data as IMessage;
}

export async function searchMessages(q: string) {
  const { data } = await api.get<IApiResponse<IPaginated<IMessage>>>("/conversations/search-messages", { params: { q } });
  return data.data as IPaginated<IMessage>;
}
