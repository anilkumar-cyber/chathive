import { IUserPublic } from "@nexuschat/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: IUserPublic | null;
  accessToken: string | null;
  isHydrating: boolean;
  setSession: (user: IUserPublic, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (patch: Partial<IUserPublic>) => void;
  clearSession: () => void;
  setHydrating: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrating: true,
      setSession: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      updateUser: (patch) => set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
      clearSession: () => set({ user: null, accessToken: null }),
      setHydrating: (val) => set({ isHydrating: val }),
    }),
    {
      name: "nexuschat-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
