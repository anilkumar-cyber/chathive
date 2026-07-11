import { IApiResponse, IUserPublic } from "@nexuschat/shared";
import { api } from "@/lib/api";

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<IApiResponse<{ userId: string; email: string }>>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<IApiResponse<{ accessToken: string; user: IUserPublic; requiresTwoFactor?: boolean }>>(
    "/auth/login",
    payload
  );
  return data;
}

export async function guestLogin(username: string) {
  const { data } = await api.post<IApiResponse<{ accessToken: string; user: IUserPublic }>>("/auth/guest", { username });
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post<IApiResponse<null>>("/auth/verify-email", { token });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<IApiResponse<null>>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  const { data } = await api.post<IApiResponse<null>>("/auth/reset-password", { token, password, confirmPassword });
  return data;
}

export async function logout() {
  const { data } = await api.post<IApiResponse<null>>("/auth/logout");
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<IApiResponse<IUserPublic>>("/auth/me");
  return data;
}

export function googleLoginUrl(): string {
  const base = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");
  return `${base}/auth/google`;
}
