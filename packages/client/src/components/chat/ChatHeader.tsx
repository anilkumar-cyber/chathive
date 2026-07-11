import { ConversationType, IConversation, UserStatus } from "@nexuschat/shared";
import { FiArrowLeft, FiPhone, FiSearch, FiUsers, FiVideo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getConversationDisplay, getOtherParticipant } from "@/utils/conversation";
import toast from "react-hot-toast";

export function ChatHeader({ conversation }: { conversation: IConversation }) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const navigate = useNavigate();
  const { name, avatar } = getConversationDisplay(conversation, currentUserId);
  const other = getOtherParticipant(conversation, currentUserId);
  const isOnline = other ? onlineUserIds.has(other._id) : false;

  function notReady() {
    toast("Voice/video calling ships in the next release.", { icon: "🚧" });
  }

  return (
    <div className="glass flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/chats")} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 md:hidden">
          <FiArrowLeft size={18} />
        </button>
        <Avatar
          src={avatar}
          name={name}
          status={conversation.type === ConversationType.PRIVATE ? (isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE) : undefined}
        />
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-gray-400">
            {conversation.type === ConversationType.PRIVATE
              ? isOnline
                ? "Online"
                : "Offline"
              : `${(conversation.participants as unknown[])?.length ?? 0} members`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={notReady} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10" title="Voice call">
          <FiPhone size={17} />
        </button>
        <button onClick={notReady} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10" title="Video call">
          <FiVideo size={17} />
        </button>
        {conversation.type !== ConversationType.PRIVATE && (
          <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10" title="Members">
            <FiUsers size={17} />
          </button>
        )}
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10" title="Search in conversation">
          <FiSearch size={17} />
        </button>
      </div>
    </div>
  );
}
