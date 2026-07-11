import { formatDistanceToNowStrict } from "date-fns";
import { useMemo, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { ConversationType, UserStatus } from "@nexuschat/shared";
import { Avatar } from "@/components/ui/Avatar";
import { ConversationSkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConversations } from "@/hooks/useConversations";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { formatMessagePreview, getConversationDisplay } from "@/utils/conversation";
import { NewChatModal } from "./NewChatModal";

const tabs = [
  { key: "all", label: "All" },
  { key: ConversationType.PRIVATE, label: "Direct" },
  { key: ConversationType.GROUP, label: "Groups" },
] as const;

export function ConversationList() {
  const { conversations, isLoading } = useConversations();
  const currentUserId = useAuthStore((s) => s.user?._id);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { conversationId: activeId } = useParams();

  const filtered = useMemo(() => {
    return conversations
      .filter((c) => c.type !== ConversationType.ROOM)
      .filter((c) => tab === "all" || c.type === tab)
      .filter((c) => {
        if (!query) return true;
        const { name } = getConversationDisplay(c, currentUserId);
        return name.toLowerCase().includes(query.toLowerCase());
      });
  }, [conversations, tab, query, currentUserId]);

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-100 dark:border-white/5 md:w-[340px]">
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-xl font-bold">Chats</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-gradient flex h-9 w-9 items-center justify-center rounded-xl"
          title="New chat"
        >
          <FiPlus size={18} />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="input-base pl-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              tab === t.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationSkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState title="No conversations yet" description="Start a new chat to say hello." />
        ) : (
          <ul>
            {filtered.map((c) => {
              const { name, avatar, subtitle } = getConversationDisplay(c, currentUserId);
              const isPrivate = c.type === ConversationType.PRIVATE;
              const otherId = isPrivate
                ? ((c.participants as { _id: string }[]).find((p) => p._id !== currentUserId)?._id)
                : undefined;
              const isOnline = otherId ? onlineUserIds.has(otherId) : false;

              return (
                <li key={c._id}>
                  <button
                    onClick={() => navigate(`/chats/${c._id}`)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/5",
                      activeId === c._id && "bg-brand-50 dark:bg-white/10"
                    )}
                  >
                    <Avatar
                      src={avatar}
                      name={name}
                      status={isPrivate ? (isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE) : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        {c.lastMessageAt && (
                          <span className="shrink-0 text-[11px] text-gray-400">
                            {formatDistanceToNowStrict(new Date(c.lastMessageAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {c.lastMessage ? formatMessagePreview(c) : subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NewChatModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
