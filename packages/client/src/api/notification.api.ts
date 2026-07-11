import { IApiResponse, INotification } from "@nexuschat/shared";
import { api } from "@/lib/api";

export async function listNotifications(page = 1) {
  const { data } = await api.get<
    IApiResponse<{ items: INotification[]; total: number; unreadCount: number; page: number; totalPages: number }>
  >("/notifications", { params: { page } });
  return data.data as { items: INotification[]; total: number; unreadCount: number; page: number; totalPages: number };
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch("/notifications/read-all");
}

export async function deleteNotification(id: string) {
  await api.delete(`/notifications/${id}`);
}
