import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiSearch, FiUserX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "@/api/user.api";
import { startPrivateConversation } from "@/api/chat.api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ConversationSkeletonList } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { IUserPublic } from "@nexuschat/shared";

export function PeoplePage() {
  const [results, setResults] = useState<IUserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const currentUserId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    setIsLoading(true);
    searchUsers({ q: query || undefined, country: country || undefined, onlineOnly: onlineOnly || undefined })
      .then((res) => setResults(res.items))
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [query, country, onlineOnly]);

  async function handleMessage(userId: string) {
    try {
      const conversation = await startPrivateConversation(userId);
      upsertConversation(conversation);
      navigate(`/chats/${conversation._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
      <h1 className="mb-1 text-2xl font-bold">People</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Everyone on NexusChat. Tap Message to start a direct conversation.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" className="input-base pl-9 py-2 text-sm" />
        </div>
        <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="max-w-[160px]" />
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm dark:border-gray-700">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
          Online only
        </label>
      </div>

      {isLoading ? (
        <ConversationSkeletonList />
      ) : results.filter((u) => u._id !== currentUserId).length === 0 ? (
        <EmptyState icon={<FiUserX size={26} />} title="No users found" description="Try a different search or filter." />
      ) : (
        <div className="space-y-2">
          {results
            .filter((u) => u._id !== currentUserId)
            .map((u) => (
              <div key={u._id} className="card flex items-center gap-3 p-3">
                <Avatar src={u.avatar} name={u.username} status={u.status} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {u.username}{" "}
                    {u.isGuest && (
                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        Guest
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{u.country ?? "Unknown"}</p>
                </div>
                <Button size="sm" onClick={() => handleMessage(u._id)}>
                  Message
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
