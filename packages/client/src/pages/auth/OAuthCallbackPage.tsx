import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchMe } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const redirect = params.get("redirect");

    if (!accessToken) {
      toast.error("Google sign-in failed");
      navigate("/login");
      return;
    }

    useAuthStore.getState().setAccessToken(accessToken);
    fetchMe()
      .then((res) => {
        if (res.data) setSession(res.data, accessToken);
        navigate(redirect || "/people");
      })
      .catch(() => {
        toast.error("Could not complete Google sign-in");
        navigate("/login");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FullScreenLoader />;
}
