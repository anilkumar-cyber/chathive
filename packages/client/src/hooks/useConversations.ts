import { useEffect, useState } from "react";
import { listConversations } from "@/api/chat.api";
import { useChatStore } from "@/store/chatStore";

export function useConversations() {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listConversations()
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { conversations, isLoading };
}
