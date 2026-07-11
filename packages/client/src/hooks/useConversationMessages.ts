import { SocketEvents } from "@nexuschat/shared";
import { useEffect, useRef, useState } from "react";
import { getMessages } from "@/api/chat.api";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";

export function useConversationMessages(conversationId?: string) {
  const messages = useChatStore((s) => (conversationId ? s.messagesByConversation[conversationId] ?? [] : []));
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    socket?.emit(SocketEvents.JOIN_CONVERSATION, conversationId);

    if (loadedRef.current !== conversationId) {
      setIsLoading(true);
      getMessages(conversationId)
        .then((data) => {
          setMessages(conversationId, data);
          setHasMore(data.length === 30);
          loadedRef.current = conversationId;
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    socket?.emit(SocketEvents.MESSAGE_SEEN, { conversationId });

    return () => {
      socket?.emit(SocketEvents.LEAVE_CONVERSATION, conversationId);
    };
  }, [conversationId, setMessages]);

  async function loadMore() {
    if (!conversationId || messages.length === 0) return;
    const oldest = messages[0];
    const older = await getMessages(conversationId, oldest._id);
    prependMessages(conversationId, older);
    if (older.length < 30) setHasMore(false);
  }

  return { messages, isLoading, hasMore, loadMore };
}
