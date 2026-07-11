import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiMessageCircle } from "react-icons/fi";
import { IConversation } from "@nexuschat/shared";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { EmptyState } from "@/components/ui/EmptyState";
import { getConversation } from "@/api/chat.api";
import { useChatStore } from "@/store/chatStore";

export function ChatsPage() {
  const { conversationId, roomId } = useParams();
  const id = conversationId ?? roomId;
  const conversations = useChatStore((s) => s.conversations);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [active, setActive] = useState<IConversation | null>(null);

  useEffect(() => {
    if (!id) {
      setActive(null);
      return;
    }
    const fromStore = conversations.find((c) => c._id === id);
    if (fromStore) {
      setActive(fromStore);
      return;
    }
    getConversation(id).then((c) => {
      upsertConversation(c);
      setActive(c);
    });
  }, [id, conversations, upsertConversation]);

  return (
    <div className="flex h-full w-full">
      <div className={id ? "hidden md:block" : "block w-full md:block"}>
        <ConversationList />
      </div>
      <div className={id ? "flex-1" : "hidden flex-1 md:flex"}>
        {active ? (
          <ChatWindow conversation={active} />
        ) : (
          <EmptyState
            icon={<FiMessageCircle size={26} />}
            title="Select a conversation"
            description="Choose a chat from the list, or start a new one."
          />
        )}
      </div>
    </div>
  );
}
