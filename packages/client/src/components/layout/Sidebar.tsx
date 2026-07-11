import clsx from "clsx";
import {
  FiBell,
  FiHash,
  FiLogOut,
  FiMessageCircle,
  FiMoon,
  FiSettings,
  FiSun,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { logout as logoutApi } from "@/api/auth.api";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useUIStore } from "@/store/uiStore";
import { disconnectSocket } from "@/lib/socket";

const navItems = [
  { to: "/chats", icon: FiMessageCircle, label: "Chats" },
  { to: "/people", icon: FiUsers, label: "People" },
  { to: "/friends", icon: FiUserCheck, label: "Friends", guestHidden: true },
  { to: "/rooms", icon: FiHash, label: "Rooms" },
  { to: "/notifications", icon: FiBell, label: "Alerts", badgeKey: "unread" },
  { to: "/settings", icon: FiSettings, label: "Settings" },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter((item) => !item.guestHidden || !user?.isGuest);

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      disconnectSocket();
      clearSession();
      navigate("/login");
    }
  }

  return (
    <aside className="glass flex h-screen w-[76px] flex-col items-center justify-between border-r py-5 md:w-20">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 font-bold text-white shadow-glow">
          C
        </div>

        <nav className="flex flex-col items-center gap-2">
          {visibleNavItems.map(({ to, icon: Icon, label, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                clsx(
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl transition",
                  isActive
                    ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                )
              }
            >
              <Icon size={20} />
              {badgeKey === "unread" && unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          title="Toggle theme"
        >
          {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        <NavLink to={`/profile/${user?._id}`} title={user?.isGuest ? "Guest profile" : "Profile"} className="relative">
          <Avatar src={user?.avatar} name={user?.username} status={user?.status} size="sm" />
          {user?.isGuest && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1 text-[8px] font-bold text-white">G</span>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10"
          title="Logout"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
