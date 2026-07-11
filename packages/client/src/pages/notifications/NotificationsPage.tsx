import { useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { FiBell } from "react-icons/fi";
import { IUserPublic } from "@nexuschat/shared";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/notification.api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotificationStore } from "@/store/notificationStore";
import clsx from "clsx";

export function NotificationsPage() {
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    listNotifications().then((res) => setNotifications(res.items, res.unreadCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await markAllNotificationsRead();
              markAllRead();
            }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<FiBell size={26} />} title="You're all caught up" description="New activity will show up here." />
      ) : (
        <div className="space-y-1.5">
          {items.map((n) => {
            const sender = n.sender as IUserPublic | undefined;
            return (
              <button
                key={n._id}
                onClick={async () => {
                  if (!n.isRead) {
                    await markNotificationRead(n._id);
                    markRead(n._id);
                  }
                }}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/5",
                  !n.isRead && "bg-brand-50/60 dark:bg-brand-500/10"
                )}
              >
                <Avatar src={sender?.avatar} name={sender?.username} size="sm" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{sender?.username ?? "NexusChat"}</span> {n.content}
                  </p>
                  <p className="text-xs text-gray-400">{formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
