import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiHash, FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ROOM_CATEGORIES } from "@nexuschat/shared";
import { createRoom, joinRoom, listRooms } from "@/api/chat.api";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { IConversation } from "@nexuschat/shared";

export function RoomsPage() {
  const isGuest = useAuthStore((s) => s.user?.isGuest);
  const [rooms, setRooms] = useState<IConversation[]>([]);
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState<string>(ROOM_CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  function refresh() {
    listRooms(category || undefined, query || undefined).then((res) => setRooms(res.items));
  }

  useEffect(refresh, [category, query]);

  async function handleJoin(roomId: string) {
    try {
      const room = await joinRoom(roomId);
      upsertConversation(room);
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const room = await createRoom(name.trim(), newCategory as never, description.trim() || undefined);
      upsertConversation(room);
      setModalOpen(false);
      setName("");
      setDescription("");
      navigate(`/rooms/${room._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Public Rooms</h1>
        {!isGuest && (
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus size={16} /> Create Room
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rooms…" className="input-base pl-9 py-2 text-sm" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base w-auto py-2 text-sm">
          <option value="">All categories</option>
          {ROOM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {rooms.length === 0 ? (
        <EmptyState icon={<FiHash size={26} />} title="No rooms found" description="Be the first to create one!" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room._id} className="card flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500">
                  <FiHash size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{room.name}</p>
                  <p className="text-xs text-gray-400">{room.category}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{room.description}</p>
              <Button size="sm" onClick={() => handleJoin(room._id)} className="mt-1">
                Join Room
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a room">
        <div className="space-y-3">
          <Input placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-base">
            {ROOM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-base resize-none"
            rows={3}
          />
          <Button className="w-full" onClick={handleCreate} isLoading={isSubmitting}>
            Create Room
          </Button>
        </div>
      </Modal>
    </div>
  );
}
