import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { verifyEmail } from "@/api/auth.api";
import { apiErrorMessage } from "@/lib/api";

type Status = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(apiErrorMessage(err, "Verification link is invalid or expired."));
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center text-center">
      {status === "loading" && <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />}
      {status === "success" && (
        <>
          <FiCheckCircle className="mb-3 text-emerald-500" size={48} />
          <h1 className="mb-1 text-xl font-bold">Email verified!</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">You can now sign in to your account.</p>
        </>
      )}
      {status === "error" && (
        <>
          <FiXCircle className="mb-3 text-red-500" size={48} />
          <h1 className="mb-1 text-xl font-bold">Verification failed</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </>
      )}
      {status !== "loading" && (
        <Link to="/login" className="text-sm font-medium text-brand-500 hover:underline">
          Go to sign in
        </Link>
      )}
    </div>
  );
}
