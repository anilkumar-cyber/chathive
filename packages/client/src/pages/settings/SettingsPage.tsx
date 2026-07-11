import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiBell, FiLock, FiMoon, FiShield, FiSliders, FiUser, FiUsers } from "react-icons/fi";
import { ProfilePrivacy } from "@nexuschat/shared";
import { api } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { useUIStore, type ThemeMode } from "@/store/uiStore";
import { deleteAccount, downloadMyData, unblockUser, updateProfile } from "@/api/user.api";

const sections = [
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "appearance", label: "Appearance", icon: FiMoon },
  { key: "privacy", label: "Privacy", icon: FiSliders },
  { key: "security", label: "Security", icon: FiShield },
  { key: "blocked", label: "Blocked Users", icon: FiUsers },
  { key: "notifications", label: "Notifications", icon: FiBell },
  { key: "account", label: "Account", icon: FiLock },
] as const;

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const visibleSections = user?.isGuest ? sections.filter((s) => s.key === "appearance") : sections;
  const [active, setActive] = useState<(typeof sections)[number]["key"]>(user?.isGuest ? "appearance" : "profile");
  const updateUser = useAuthStore((s) => s.updateUser);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [bio, setBio] = useState(user?.bio ?? "");
  const [profession, setProfession] = useState(user?.profession ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [privacy, setPrivacy] = useState<ProfilePrivacy>(user?.profilePrivacy ?? ProfilePrivacy.PUBLIC);

  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<{ _id: string; username: string; avatar?: string }[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (active === "blocked") {
      api.get("/settings/blocked-users").then((res) => setBlockedUsers(res.data.data));
    }
  }, [active]);

  async function handleSaveProfile() {
    try {
      const updated = await updateProfile({ bio, profession, country });
      updateUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSavePrivacy() {
    try {
      const updated = await updateProfile({ profilePrivacy: privacy });
      updateUser(updated);
      toast.success("Privacy settings updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSetup2FA() {
    try {
      const res = await api.post("/settings/2fa/setup");
      setQrCode(res.data.data.qrCodeDataUrl);
      setTwoFAOpen(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleConfirm2FA() {
    try {
      await api.post("/settings/2fa/confirm", { code });
      toast.success("Two-factor authentication enabled");
      setTwoFAOpen(false);
      setCode("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Invalid code"));
    }
  }

  async function handleDisable2FA() {
    await api.post("/settings/2fa/disable");
    toast.success("Two-factor authentication disabled");
  }

  return (
    <div className="flex w-full overflow-hidden">
      <div className="w-56 shrink-0 overflow-y-auto border-r border-gray-100 p-4 dark:border-white/5">
        <h1 className="mb-4 px-2 text-lg font-bold">Settings</h1>
        <nav className="space-y-1">
          {visibleSections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active === key ? "bg-brand-500 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {user?.isGuest && (
          <div className="mb-6 max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            You're chatting as a guest — profile, privacy, security, and account settings unlock with a free account.
          </div>
        )}
        {active === "profile" && (
          <div className="max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatar} name={user?.username} size="xl" />
              <div className="text-sm text-gray-500">Avatar upload available from your Profile page.</div>
            </div>
            <Input label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself" />
            <Input label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Button onClick={handleSaveProfile}>Save changes</Button>
          </div>
        )}

        {active === "appearance" && (
          <div className="max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex-1 rounded-xl border p-4 text-sm font-medium capitalize transition ${
                    theme === mode ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {active === "privacy" && (
          <div className="max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Privacy</h2>
            <div className="space-y-2">
              {Object.values(ProfilePrivacy).map((p) => (
                <label key={p} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <input type="radio" checked={privacy === p} onChange={() => setPrivacy(p)} />
                  <span className="text-sm capitalize">{p.replace("_", " ")}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSavePrivacy}>Save privacy settings</Button>
          </div>
        )}

        {active === "security" && (
          <div className="max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Security</h2>
            <div className="card p-4">
              <p className="mb-1 text-sm font-semibold">Two-factor authentication</p>
              <p className="mb-3 text-xs text-gray-500">Add an extra layer of security using an authenticator app.</p>
              {user?.role && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSetup2FA}>
                    Setup 2FA
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleDisable2FA}>
                    Disable
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "blocked" && (
          <div className="max-w-lg space-y-2">
            <h2 className="mb-2 text-lg font-semibold">Blocked users</h2>
            {blockedUsers.length === 0 && <p className="text-sm text-gray-400">You haven't blocked anyone.</p>}
            {blockedUsers.map((u) => (
              <div key={u._id} className="card flex items-center gap-3 p-3">
                <Avatar src={u.avatar} name={u.username} size="sm" />
                <p className="flex-1 text-sm font-medium">{u.username}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await unblockUser(u._id);
                    setBlockedUsers((prev) => prev.filter((x) => x._id !== u._id));
                  }}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}

        {active === "notifications" && (
          <div className="max-w-lg space-y-3">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-gray-500">
              Push notifications are delivered via Firebase Cloud Messaging when configured on this deployment. Browser notification
              permission is requested automatically when you enable it.
            </p>
            <Button
              onClick={async () => {
                if ("Notification" in window) {
                  const perm = await Notification.requestPermission();
                  toast(perm === "granted" ? "Notifications enabled" : "Notifications blocked");
                }
              }}
            >
              Enable browser notifications
            </Button>
          </div>
        )}

        {active === "account" && (
          <div className="max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">Account</h2>
            <Button
              variant="secondary"
              onClick={async () => {
                const data = await downloadMyData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "nexuschat-data.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download my data
            </Button>
            <div className="card border-red-200 p-4 dark:border-red-500/30">
              <p className="mb-1 text-sm font-semibold text-red-500">Danger zone</p>
              <p className="mb-3 text-xs text-gray-500">Deleting your account is permanent and cannot be undone.</p>
              <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
                Delete account
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={twoFAOpen} onClose={() => setTwoFAOpen(false)} title="Set up two-factor authentication">
        <div className="space-y-3 text-center">
          {qrCode && <img src={qrCode} alt="2FA QR code" className="mx-auto rounded-xl border" />}
          <p className="text-xs text-gray-500">Scan with Google Authenticator, then enter the 6-digit code below.</p>
          <Input placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          <Button className="w-full" onClick={handleConfirm2FA}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete your account?">
        <p className="mb-4 text-sm text-gray-500">This will permanently delete your account and cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              await deleteAccount();
              window.location.href = "/login";
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
