import { format } from "date-fns";
import clsx from "clsx";
import { useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiCornerUpLeft,
  FiEdit2,
  FiMoreHorizontal,
  FiSmile,
  FiTrash2,
} from "react-icons/fi";
import { BsCheckAll } from "react-icons/bs";
import toast from "react-hot-toast";
import { IMessage, MessageStatus, MessageType } from "@nexuschat/shared";
import { Avatar } from "@/components/ui/Avatar";
import { deleteMessage, reactToMessage, togglePinMessage } from "@/api/chat.api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageBubbleProps {
  message: IMessage;
  conversationId: string;
  showAvatar: boolean;
  onReply: (message: IMessage) => void;
  onEdit: (message: IMessage) => void;
}

export function MessageBubble({ message, conversationId, showAvatar, onReply, onEdit }: MessageBubbleProps) {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const sender = typeof message.sender === "object" ? message.sender : null;
  const isMine = sender?._id === currentUserId;

  if (message.isDeletedForEveryone) {
    return (
      <div className={clsx("flex px-4 py-1", isMine ? "justify-end" : "justify-start")}>
        <p className="rounded-2xl bg-gray-100 px-4 py-2 text-xs italic text-gray-400 dark:bg-white/5">This message was deleted</p>
      </div>
    );
  }

  async function handleReact(emoji: string) {
    try {
      const updated = await reactToMessage(message._id, emoji);
      updateMessage(conversationId, updated);
    } catch {
      toast.error("Could not react to message");
    }
    setShowEmojiBar(false);
  }

  async function handleDelete(forEveryone: boolean) {
    try {
      await deleteMessage(message._id, forEveryone);
      if (forEveryone) {
        updateMessage(conversationId, { ...message, isDeletedForEveryone: true, content: "", attachments: [] });
      } else {
        removeMessage(conversationId, message._id);
      }
    } catch {
      toast.error("Could not delete message");
    }
    setShowMenu(false);
  }

  async function handlePin() {
    try {
      const updated = await togglePinMessage(message._id);
      updateMessage(conversationId, updated);
      toast.success(updated.isPinned ? "Message pinned" : "Message unpinned");
    } catch {
      toast.error("Could not pin message");
    }
    setShowMenu(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
    setShowMenu(false);
  }

  const reactionGroups = (message.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={clsx("group flex items-end gap-2 px-4 py-1", isMine ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiBar(false);
        setShowMenu(false);
      }}
    >
      {!isMine && (showAvatar ? <Avatar src={sender?.avatar} name={sender?.username} size="xs" /> : <div className="w-6" />)}

      <div className={clsx("relative flex max-w-[70%] flex-col", isMine ? "items-end" : "items-start")}>
        {message.replyTo && typeof message.replyTo === "object" && (
          <div className="mb-1 max-w-full truncate rounded-lg border-l-2 border-brand-500 bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-white/5">
            {(message.replyTo as IMessage).content || "Attachment"}
          </div>
        )}

        <div
          className={clsx(
            "relative rounded-2xl px-4 py-2 text-sm shadow-sm",
            isMine ? "rounded-br-md bg-gradient-to-br from-brand-500 to-accent-500 text-white" : "rounded-bl-md bg-white dark:bg-surface-darkAlt border border-gray-100 dark:border-white/5"
          )}
        >
          {!isMine && showAvatar && <p className="mb-0.5 text-xs font-semibold text-brand-500">{sender?.username}</p>}

          {message.type === MessageType.IMAGE && message.attachments?.[0] && (
            <img src={message.attachments[0].url} alt="" className="mb-1 max-h-64 rounded-lg object-cover" />
          )}
          {message.type === MessageType.VIDEO && message.attachments?.[0] && (
            <video src={message.attachments[0].url} controls className="mb-1 max-h-64 rounded-lg" />
          )}
          {message.type === MessageType.AUDIO && message.attachments?.[0] && (
            <audio src={message.attachments[0].url} controls className="mb-1 w-56" />
          )}
          {message.type === MessageType.DOCUMENT && message.attachments?.[0] && (
            <a
              href={message.attachments[0].url}
              target="_blank"
              rel="noreferrer"
              className="mb-1 flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-xs underline"
            >
              📄 {message.attachments[0].fileName ?? "Download file"}
            </a>
          )}

          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

          <div className={clsx("mt-1 flex items-center gap-1 text-[10px]", isMine ? "text-white/70" : "text-gray-400")}>
            {message.isEdited && <span>edited</span>}
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {isMine && (
              <span>
                {message.status === MessageStatus.READ ? (
                  <BsCheckAll className="text-sky-300" size={13} />
                ) : message.status === MessageStatus.DELIVERED ? (
                  <BsCheckAll size={13} />
                ) : (
                  <FiCheck size={12} />
                )}
              </span>
            )}
          </div>
        </div>

        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-1 flex gap-1">
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-xs dark:border-white/10 dark:bg-surface-darkAlt"
              >
                {emoji} {count > 1 && count}
              </button>
            ))}
          </div>
        )}

        {showActions && (
          <div className={clsx("absolute top-0 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-md dark:bg-surface-darkAlt", isMine ? "-left-2 -translate-x-full" : "-right-2 translate-x-full")}>
            <button onClick={() => setShowEmojiBar((v) => !v)} className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-white/10" title="React">
              <FiSmile size={14} />
            </button>
            <button onClick={() => onReply(message)} className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-white/10" title="Reply">
              <FiCornerUpLeft size={14} />
            </button>
            {isMine && (
              <button onClick={() => onEdit(message)} className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-white/10" title="Edit">
                <FiEdit2 size={14} />
              </button>
            )}
            <button onClick={() => setShowMenu((v) => !v)} className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-white/10" title="More">
              <FiMoreHorizontal size={14} />
            </button>

            {showEmojiBar && (
              <div className="absolute top-9 z-10 flex gap-1 rounded-xl bg-white p-1.5 shadow-lg dark:bg-surface-darkAlt">
                {QUICK_EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => handleReact(emoji)} className="text-lg hover:scale-125 transition">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {showMenu && (
              <div className="absolute top-9 z-10 w-40 rounded-xl bg-white py-1 text-sm shadow-lg dark:bg-surface-darkAlt">
                <button onClick={handleCopy} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">
                  <FiCopy size={13} /> Copy
                </button>
                <button onClick={handlePin} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">
                  📌 {message.isPinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => handleDelete(false)} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">
                  <FiTrash2 size={13} /> Delete for me
                </button>
                {isMine && (
                  <button onClick={() => handleDelete(true)} className="flex w-full items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <FiTrash2 size={13} /> Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
