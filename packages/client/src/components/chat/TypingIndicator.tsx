import { motion } from "framer-motion";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const typingUserIds = useChatStore((s) => s.typingByConversation[conversationId] ?? []);
  const currentUserId = useAuthStore((s) => s.user?._id);
  const others = typingUserIds.filter((id) => id !== currentUserId);

  if (others.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 px-4 py-1 text-xs text-gray-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gray-400" style={{ animationDelay: "200ms" }} />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gray-400" style={{ animationDelay: "400ms" }} />
      </span>
      typing…
    </motion.div>
  );
}
