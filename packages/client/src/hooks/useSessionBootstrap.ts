import { useEffect } from "react";
import axios from "axios";
import { fetchMe } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

export function useSessionBootstrap(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrating = useAuthStore((s) => s.setHydrating);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        const accessToken = refreshRes.data.data.accessToken as string;
        if (cancelled) return;

        useAuthStore.getState().setAccessToken(accessToken);
        const meRes = await fetchMe();
        if (!cancelled && meRes.data) setSession(meRes.data, accessToken);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
