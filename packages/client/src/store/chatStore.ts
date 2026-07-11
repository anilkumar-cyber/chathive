import { IConversation, IMessage } from "@nexuschat/shared";
import { create } from "zustand";

interface ChatState {
  conversations: IConversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, IMessage[]>;
  typingByConversation: Record<string, string[]>;
  onlineUserIds: Set<string>;

  setConversations: (conversations: IConversation[]) => void;
  upsertConversation: (conversation: IConversation) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, messages: IMessage[]) => void;
  prependMessages: (conversationId: string, messages: IMessage[]) => void;
  addMessage: (conversationId: string, message: IMessage) => void;
  updateMessage: (conversationId: string, message: IMessage) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, online: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},
  onlineUserIds: new Set(),

  setConversations: (conversations) => set({ conversations }),
  upsertConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some((c) => c._id === conversation._id);
      const next = exists
        ? state.conversations.map((c) => (c._id === conversation._id ? conversation : c))
        : [conversation, ...state.conversations];
      next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { conversations: next };
    }),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({ messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages } })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...messages, ...(state.messagesByConversation[conversationId] ?? [])],
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] ?? [];
      if (existing.some((m) => m._id === message._id)) return state;
      return {
        messagesByConversation: { ...state.messagesByConversation, [conversationId]: [...existing, message] },
      };
    }),

  updateMessage: (conversationId, message) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((m) =>
          m._id === message._id ? message : m
        ),
      },
    })),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] ?? []).filter((m) => m._id !== messageId),
      },
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingByConversation[conversationId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typingByConversation: { ...state.typingByConversation, [conversationId]: Array.from(current) } };
    }),

  setUserOnline: (userId, online) => {
    const ids = new Set(get().onlineUserIds);
    if (online) ids.add(userId);
    else ids.delete(userId);
    set({ onlineUserIds: ids });
  },
}));
