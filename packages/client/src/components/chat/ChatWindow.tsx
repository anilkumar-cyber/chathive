import { IConversation, IMessage } from "@nexuschat/shared";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { MessageSkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { FiMessageCircle } from "react-icons/fi";

export function ChatWindow({ conversation }: { conversation: IConversation }) {
  const { messages, isLoading, hasMore, loadMore } = useConversationMessages(conversation._id);
  const [replyTo, setReplyTo] = useState<IMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (el.scrollTop < 80 && hasMore) loadMore();
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader conversation={conversation} />

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-3">
        {isLoading ? (
          <MessageSkeletonList />
        ) : messages.length === 0 ? (
          <EmptyState icon={<FiMessageCircle size={26} />} title="Say hello!" description="No messages yet — start the conversation." />
        ) : (
          messages.map((message, idx) => {
            const prev = messages[idx - 1];
            const prevSender = prev && typeof prev.sender === "object" ? prev.sender._id : prev?.sender;
            const curSender = typeof message.sender === "object" ? message.sender._id : message.sender;
            const showAvatar = prevSender !== curSender;
            return (
              <MessageBubble
                key={message._id}
                message={message}
                conversationId={conversation._id}
                showAvatar={showAvatar}
                onReply={setReplyTo}
                onEdit={setEditingMessage}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator conversationId={conversation._id} />

      <MessageInput
        conversationId={conversation._id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
