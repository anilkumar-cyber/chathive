import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCamera, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { IUserPublic } from "@nexuschat/shared";
import { getUserById, uploadAvatar, uploadCoverPhoto, updateProfile, blockUser } from "@/api/user.api";
import { sendFriendRequest } from "@/api/friend.api";
import { startPrivateConversation } from "@/api/chat.api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

export function ProfilePage() {
  const { userId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const updateCurrentUser = useAuthStore((s) => s.updateUser);
  const isOwn = userId === currentUser?._id;
  const [profile, setProfile] = useState<IUserPublic | null>(isOwn ? currentUser : null);
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  useEffect(() => {
    if (!userId) return;
    if (isOwn) {
      setProfile(currentUser);
    } else {
      getUserById(userId).then(setProfile).catch(() => toast.error("Could not load profile"));
    }
  }, [userId, isOwn, currentUser]);

  async function handleAvatarChange(file: File) {
    try {
      const url = await uploadAvatar(file);
      updateCurrentUser({ avatar: url });
      setProfile((p) => (p ? { ...p, avatar: url } : p));
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCoverChange(file: File) {
    try {
      const url = await uploadCoverPhoto(file);
      updateCurrentUser({ coverPhoto: url });
      setProfile((p) => (p ? { ...p, coverPhoto: url } : p));
      toast.success("Cover photo updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleMessage() {
    if (!userId) return;
    try {
      const conversation = await startPrivateConversation(userId);
      upsertConversation(conversation);
      navigate(`/chats/${conversation._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleAddFriend() {
    if (!userId) return;
    try {
      await sendFriendRequest(userId);
      toast.success("Friend request sent");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleBlock() {
    if (!userId) return;
    await blockUser(userId);
    toast.success("User blocked");
  }

  if (!profile) return <div className="p-6 text-sm text-gray-400">Loading profile…</div>;

  return (
    <div className="w-full overflow-y-auto">
      <div className="relative h-48 bg-gradient-to-br from-brand-500 to-accent-500">
        {profile.coverPhoto && <img src={profile.coverPhoto} alt="" className="h-full w-full object-cover" />}
        {isOwn && (
          <>
            <input ref={coverInputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && handleCoverChange(e.target.files[0])} />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur"
            >
              <FiCamera size={13} /> Change cover
            </button>
          </>
        )}
      </div>

      <div className="px-6">
        <div className="-mt-12 flex items-end justify-between">
          <div className="relative">
            <Avatar src={profile.avatar} name={profile.username} size="xl" status={profile.status} className="ring-4 ring-white dark:ring-surface-dark" />
            {isOwn && (
              <>
                <input ref={avatarInputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow"
                >
                  <FiCamera size={12} />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 pb-2">
            {isOwn ? (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing((v) => !v)}>
                {isEditing ? "Done" : "Edit profile"}
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={handleMessage}>
                  <FiMessageSquare size={14} /> Message
                </Button>
                <Button size="sm" variant="secondary" onClick={handleAddFriend}>
                  <FiUserPlus size={14} /> Add Friend
                </Button>
                <Button size="sm" variant="ghost" onClick={handleBlock}>
                  Block
                </Button>
              </>
            )}
          </div>
        </div>

        <h1 className="mt-3 text-xl font-bold">{profile.username}</h1>
        <p className="text-sm text-gray-400">
          {profile.profession ?? "ChatiHive member"} {profile.country && `· ${profile.country}`}
        </p>

        {!isEditing && (
          <div className="mt-4 max-w-xl space-y-4 pb-10">
            {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300">{profile.bio}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {profile.age && <ProfileField label="Age" value={String(profile.age)} />}
              {profile.gender && <ProfileField label="Gender" value={profile.gender} />}
              {profile.city && <ProfileField label="City" value={profile.city} />}
              {profile.state && <ProfileField label="State" value={profile.state} />}
            </div>
            {profile.languages && profile.languages.length > 0 && (
              <ChipList label="Languages" items={profile.languages} />
            )}
            {profile.interests && profile.interests.length > 0 && (
              <ChipList label="Interests" items={profile.interests} />
            )}
          </div>
        )}

        {isEditing && isOwn && <ProfileEditForm profile={profile} onSaved={(updated) => { setProfile(updated); updateCurrentUser(updated); }} />}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-white/10">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileEditForm({ profile, onSaved }: { profile: IUserPublic; onSaved: (u: IUserPublic) => void }) {
  const [form, setForm] = useState({
    bio: profile.bio ?? "",
    age: profile.age ?? "",
    gender: profile.gender ?? "",
    country: profile.country ?? "",
    state: profile.state ?? "",
    city: profile.city ?? "",
    profession: profile.profession ?? "",
    languages: profile.languages?.join(", ") ?? "",
    interests: profile.interests?.join(", ") ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        bio: form.bio,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender as IUserPublic["gender"],
        country: form.country,
        state: form.state,
        city: form.city,
        profession: form.profession,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSaved(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 max-w-xl space-y-3 pb-10">
      <textarea
        placeholder="Bio"
        value={form.bio}
        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        className="input-base resize-none"
        rows={3}
        maxLength={300}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Age" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
        <select
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          className="input-base"
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
        <Input placeholder="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
        <Input placeholder="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
        <Input placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <Input placeholder="Profession" value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} />
      </div>
      <Input
        placeholder="Languages (comma separated)"
        value={form.languages}
        onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
      />
      <Input
        placeholder="Interests (comma separated)"
        value={form.interests}
        onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
      />
      <Button onClick={handleSave} isLoading={isSaving}>
        Save profile
      </Button>
    </div>
  );
}
