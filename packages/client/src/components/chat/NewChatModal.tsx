import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { IUserPublic } from "@nexuschat/shared";
import { createGroup, startPrivateConversation } from "@/api/chat.api";
import { listFriends } from "@/api/friend.api";
import { searchUsers } from "@/api/user.api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const isGuest = useAuthStore((s) => s.user?.isGuest);
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [directResults, setDirectResults] = useState<IUserPublic[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  useEffect(() => {
    if (!open) return;
    if (isGuest) {
      searchUsers({ q: query || undefined }).then((res) => setDirectResults(res.items)).catch(() => undefined);
    } else if (mode === "direct") {
      listFriends().then(setFriends).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isGuest, mode, query]);

  useEffect(() => {
    if (!open) {
      setMode("direct");
      setSelected([]);
      setGroupName("");
      setQuery("");
    }
  }, [open]);

  const directCandidates = isGuest ? directResults : friends;
  const filteredCandidates =
    mode === "direct"
      ? isGuest
        ? directCandidates
        : directCandidates.filter((f) => f.username.toLowerCase().includes(query.toLowerCase()))
      : friends.filter((f) => f.username.toLowerCase().includes(query.toLowerCase()));

  async function handleDirectStart(userId: string) {
    try {
      const conversation = await startPrivateConversation(userId);
      upsertConversation(conversation);
      onClose();
      navigate(`/chats/${conversation._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || selected.length === 0) {
      toast.error("Pick a name and at least one member");
      return;
    }
    setIsSubmitting(true);
    try {
      const group = await createGroup(groupName.trim(), selected);
      upsertConversation(group);
      onClose();
      navigate(`/chats/${group._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a conversation">
      {!isGuest && (
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
          {(["direct", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
                mode === m ? "bg-white shadow-sm dark:bg-surface-darkAlt" : "text-gray-500"
              }`}
            >
              {m === "direct" ? "Direct message" : "New group"}
            </button>
          ))}
        </div>
      )}

      {mode === "group" && (
        <Input className="mb-3" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
      )}

      <Input
        placeholder={isGuest ? "Search users…" : mode === "direct" ? "Search friends" : "Search friends to add"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3"
      />

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {filteredCandidates.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            {isGuest ? "No users found. Try a different search." : mode === "direct" ? "No friends found. Add some first!" : "No friends found."}
          </p>
        )}
        {filteredCandidates.map((candidate) => (
          <button
            key={candidate._id}
            onClick={() =>
              mode === "direct"
                ? handleDirectStart(candidate._id)
                : setSelected((prev) => (prev.includes(candidate._id) ? prev.filter((id) => id !== candidate._id) : [...prev, candidate._id]))
            }
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <Avatar src={candidate.avatar} name={candidate.username} size="sm" status={candidate.status} />
            <span className="flex-1 text-sm font-medium">{candidate.username}</span>
            {mode === "group" && (
              <input type="checkbox" readOnly checked={selected.includes(candidate._id)} className="rounded" />
            )}
          </button>
        ))}
      </div>

      {mode === "group" && (
        <Button className="mt-4 w-full" onClick={handleCreateGroup} isLoading={isSubmitting}>
          Create group ({selected.length} selected)
        </Button>
      )}
    </Modal>
  );
}
