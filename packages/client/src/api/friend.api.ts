import { IApiResponse, IFriendRequest, IUserPublic } from "@nexuschat/shared";
import { api } from "@/lib/api";

export async function listFriends() {
  const { data } = await api.get<IApiResponse<IUserPublic[]>>("/friends");
  return data.data ?? [];
}

export async function listPendingRequests() {
  const { data } = await api.get<IApiResponse<{ incoming: IFriendRequest[]; outgoing: IFriendRequest[] }>>("/friends/requests");
  return data.data as { incoming: IFriendRequest[]; outgoing: IFriendRequest[] };
}

export async function sendFriendRequest(userId: string) {
  const { data } = await api.post<IApiResponse<IFriendRequest>>(`/friends/requests/${userId}`);
  return data.data as IFriendRequest;
}

export async function acceptFriendRequest(requestId: string) {
  await api.post(`/friends/requests/${requestId}/accept`);
}

export async function rejectFriendRequest(requestId: string) {
  await api.post(`/friends/requests/${requestId}/reject`);
}

export async function cancelFriendRequest(requestId: string) {
  await api.delete(`/friends/requests/${requestId}`);
}

export async function removeFriend(userId: string) {
  await api.delete(`/friends/${userId}`);
}
