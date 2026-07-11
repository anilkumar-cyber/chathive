import { IApiResponse, IPaginated, IUserPublic } from "@nexuschat/shared";
import { api } from "@/lib/api";

export interface SearchUsersParams {
  q?: string;
  country?: string;
  gender?: string;
  minAge?: string;
  maxAge?: string;
  language?: string;
  onlineOnly?: boolean;
  page?: number;
}

export async function searchUsers(params: SearchUsersParams) {
  const { data } = await api.get<IApiResponse<IPaginated<IUserPublic>>>("/users/search", { params });
  return data.data as IPaginated<IUserPublic>;
}

export async function getUserById(id: string) {
  const { data } = await api.get<IApiResponse<IUserPublic>>(`/users/${id}`);
  return data.data as IUserPublic;
}

export async function getOnlineUsers() {
  const { data } = await api.get<IApiResponse<IUserPublic[]>>("/users/online");
  return data.data ?? [];
}

export async function getRecentlyJoined() {
  const { data } = await api.get<IApiResponse<IUserPublic[]>>("/users/recent");
  return data.data ?? [];
}

export async function updateProfile(patch: Partial<IUserPublic>) {
  const { data } = await api.patch<IApiResponse<IUserPublic>>("/users/me", patch);
  return data.data as IUserPublic;
}

export async function updateStatus(status: string) {
  const { data } = await api.patch<IApiResponse<IUserPublic>>("/users/me/status", { status });
  return data.data as IUserPublic;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.post<IApiResponse<{ avatar: string }>>("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data?.avatar as string;
}

export async function uploadCoverPhoto(file: File) {
  const form = new FormData();
  form.append("cover", file);
  const { data } = await api.post<IApiResponse<{ coverPhoto: string }>>("/users/me/cover", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data?.coverPhoto as string;
}

export async function blockUser(id: string) {
  await api.post(`/users/${id}/block`);
}
export async function unblockUser(id: string) {
  await api.delete(`/users/${id}/block`);
}
export async function muteUser(id: string) {
  await api.post(`/users/${id}/mute`);
}
export async function unmuteUser(id: string) {
  await api.delete(`/users/${id}/mute`);
}

export async function deleteAccount() {
  await api.delete("/users/me");
}

export async function downloadMyData() {
  const { data } = await api.get("/users/me/data-export");
  return data;
}
