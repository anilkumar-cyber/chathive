import { SocketEvents } from "@nexuschat/shared";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useRef, useState } from "react";
import { FiPaperclip, FiSend, FiSmile, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { sendAttachment, editMessage as editMessageApi } from "@/api/chat.api";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore";
import { apiErrorMessage } from "@/lib/api";
import type { IMessage } from "@nexuschat/shared";

interface MessageInputProps {
  conversationId: string;
  replyTo: IMessage | null;
  onCancelReply: () => void;
  editingMessage: IMessage | null;
  onCancelEdit: () => void;
}

const TYPING_STOP_DELAY = 2500;

export function MessageInput({ conversationId, replyTo, onCancelReply, editingMessage, onCancelEdit }: MessageInputProps) {
  const [text, setText] = useState(editingMessage?.content ?? "");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  const theme = useUIStore((s) => s.theme);
  const updateMessage = useChatStore((s) => s.updateMessage);

  function emitTyping() {
    const socket = getSocket();
    if (!isTypingRef.current) {
      socket?.emit(SocketEvents.TYPING_START, conversationId);
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit(SocketEvents.TYPING_STOP, conversationId);
      isTypingRef.current = false;
    }, TYPING_STOP_DELAY);
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      try {
        const updated = await editMessageApi(editingMessage._id, trimmed);
        updateMessage(conversationId, updated);
        onCancelEdit();
        setText("");
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
      return;
    }

    const socket = getSocket();
    socket?.emit(
      SocketEvents.MESSAGE_SEND,
      { conversationId, content: trimmed, replyTo: replyTo?._id },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) toast.error(res.error ?? "Failed to send message");
      }
    );
    setText("");
    onCancelReply();
    socket?.emit(SocketEvents.TYPING_STOP, conversationId);
    isTypingRef.current = false;
  }

  async function handleFileSelected(file: File) {
    setIsUploading(true);
    try {
      await sendAttachment(conversationId, file);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Upload failed"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      className="relative border-t border-gray-100 p-3 dark:border-white/5"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelected(file);
      }}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-500 bg-brand-500/10 text-sm font-medium text-brand-600">
          Drop file to share
        </div>
      )}

      {(replyTo || editingMessage) && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-1.5 text-xs dark:bg-white/5">
          <span className="truncate text-gray-500">
            {editingMessage ? "Editing message" : `Replying to: ${replyTo?.content}`}
          </span>
          <button onClick={editingMessage ? onCancelEdit : onCancelReply} className="text-gray-400 hover:text-gray-700">
            <FiX size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          title="Attach file"
        >
          <FiPaperclip size={18} />
        </button>

        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={isUploading ? "Uploading file…" : "Type a message…"}
            className="input-base max-h-32 resize-none py-2.5"
          />
          {showEmoji && (
            <div className="absolute bottom-12 right-0 z-20">
              <EmojiPicker
                theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                onEmojiClick={(emoji) => setText((t) => t + emoji.emoji)}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => setShowEmoji((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          title="Emoji"
        >
          <FiSmile size={18} />
        </button>

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="btn-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
          title="Send"
        >
          <FiSend size={16} />
        </button>
      </div>
    </div>
  );
}
