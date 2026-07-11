import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiSearch, FiUserCheck, FiUserPlus, FiUsers } from "react-icons/fi";
import { IFriendRequest, IUserPublic } from "@nexuschat/shared";
import { Navigate, useNavigate } from "react-router-dom";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriends,
  listPendingRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/api/friend.api";
import { searchUsers } from "@/api/user.api";
import { startPrivateConversation } from "@/api/chat.api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

const tabs = [
  { key: "friends", label: "Friends", icon: FiUsers },
  { key: "requests", label: "Requests", icon: FiUserCheck },
  { key: "discover", label: "Discover", icon: FiUserPlus },
] as const;

export function FriendsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("friends");
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [requests, setRequests] = useState<{ incoming: IFriendRequest[]; outgoing: IFriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [discoverResults, setDiscoverResults] = useState<IUserPublic[]>([]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const isGuest = useAuthStore((s) => s.user?.isGuest);

  function refreshFriends() {
    listFriends().then(setFriends).catch(() => undefined);
  }
  function refreshRequests() {
    listPendingRequests().then(setRequests).catch(() => undefined);
  }

  useEffect(() => {
    if (isGuest) return;
    refreshFriends();
    refreshRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  useEffect(() => {
    if (tab !== "discover") return;
    searchUsers({ q: query || undefined, country: country || undefined, onlineOnly: onlineOnly || undefined })
      .then((res) => setDiscoverResults(res.items))
      .catch(() => undefined);
  }, [tab, query, country, onlineOnly]);

  async function handleMessage(userId: string) {
    try {
      const conversation = await startPrivateConversation(userId);
      upsertConversation(conversation);
      navigate(`/chats/${conversation._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      await sendFriendRequest(userId);
      toast.success("Friend request sent");
      refreshRequests();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isGuest) {
    return <Navigate to="/people" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
      <h1 className="mb-4 text-2xl font-bold">Friends</h1>

      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
              tab === key ? "bg-white shadow-sm dark:bg-surface-darkAlt" : "text-gray-500"
            }`}
          >
            <Icon size={15} /> {label}
            {key === "requests" && requests.incoming.length > 0 && (
              <span className="rounded-full bg-accent-500 px-1.5 text-[10px] text-white">{requests.incoming.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 && <EmptyState title="No friends yet" description="Discover people and send a friend request." />}
          {friends.map((f) => (
            <div key={f._id} className="card flex items-center gap-3 p-3">
              <Avatar src={f.avatar} name={f.username} status={f.status} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{f.username}</p>
                <p className="text-xs text-gray-400">{f.country ?? "Somewhere on Earth"}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleMessage(f._id)}>
                Message
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await removeFriend(f._id);
                  refreshFriends();
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">Incoming</h2>
            <div className="space-y-2">
              {requests.incoming.length === 0 && <p className="text-sm text-gray-400">No incoming requests.</p>}
              {requests.incoming.map((r) => {
                const from = r.from as IUserPublic;
                return (
                  <div key={r._id} className="card flex items-center gap-3 p-3">
                    <Avatar src={from.avatar} name={from.username} />
                    <p className="flex-1 text-sm font-semibold">{from.username}</p>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await acceptFriendRequest(r._id);
                        refreshRequests();
                        refreshFriends();
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await rejectFriendRequest(r._id);
                        refreshRequests();
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">Outgoing</h2>
            <div className="space-y-2">
              {requests.outgoing.length === 0 && <p className="text-sm text-gray-400">No outgoing requests.</p>}
              {requests.outgoing.map((r) => {
                const to = r.to as IUserPublic;
                return (
                  <div key={r._id} className="card flex items-center gap-3 p-3">
                    <Avatar src={to.avatar} name={to.username} />
                    <p className="flex-1 text-sm font-semibold">{to.username}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await cancelFriendRequest(r._id);
                        refreshRequests();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "discover" && (
        <div>
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

          <div className="space-y-2">
            {discoverResults.length === 0 && <EmptyState title="No users found" description="Try a different search or filter." />}
            {discoverResults.map((u) => (
              <div key={u._id} className="card flex items-center gap-3 p-3">
                <Avatar src={u.avatar} name={u.username} status={u.status} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{u.username}</p>
                  <p className="text-xs text-gray-400">
                    {u.country ?? "Unknown"} {u.age ? `· ${u.age}` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleSendRequest(u._id)}>
                  Add Friend
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
