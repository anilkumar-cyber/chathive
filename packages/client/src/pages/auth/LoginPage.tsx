import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { googleLoginUrl, guestLogin, login } from "@/api/auth.api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";

interface FormValues {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
  twoFactorCode?: string;
}

interface GuestFormValues {
  username: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<"account" | "guest">("account");

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">Welcome back</h1>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">Sign in to keep the conversation going.</p>

      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
        {(["account", "guest"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition ${
              mode === m ? "bg-white shadow-sm dark:bg-surface-darkAlt" : "text-gray-500"
            }`}
          >
            {m === "account" ? "Sign in" : "Chat as guest"}
          </button>
        ))}
      </div>

      {mode === "account" ? <AccountLoginForm /> : <GuestLoginForm />}
    </div>
  );
}

function AccountLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { rememberMe: false } });
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  async function onSubmit(values: FormValues) {
    try {
      const res = await login(values);
      if (res.data?.requiresTwoFactor) {
        setNeedsTwoFactor(true);
        toast("Enter your 2FA code to continue.");
        return;
      }
      if (res.data) {
        setSession(res.data.user, res.data.accessToken);
        toast.success("Welcome back!");
        navigate("/people");
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Invalid credentials"));
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email or username"
          icon={<FiMail size={16} />}
          placeholder="you@example.com"
          error={errors.emailOrUsername?.message}
          {...register("emailOrUsername", { required: "This field is required" })}
        />
        <Input
          label="Password"
          type="password"
          icon={<FiLock size={16} />}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />

        {needsTwoFactor && (
          <Input
            label="2FA Code"
            placeholder="123456"
            maxLength={6}
            error={errors.twoFactorCode?.message}
            {...register("twoFactorCode", { required: needsTwoFactor })}
          />
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="rounded" {...register("rememberMe")} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        OR
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <a href={googleLoginUrl()}>
        <Button type="button" variant="secondary" className="w-full">
          <FcGoogle size={18} /> Continue with Google
        </Button>
      </a>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-brand-500 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GuestLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuestFormValues>();
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function onSubmit(values: GuestFormValues) {
    try {
      const res = await guestLogin(values.username.trim());
      if (res.data) {
        setSession(res.data.user, res.data.accessToken);
        toast.success(`Welcome, ${res.data.user.username}!`);
        navigate("/people");
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "That username is taken, try another"));
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Pick a nickname"
          icon={<FiUser size={16} />}
          placeholder="e.g. NightOwl42"
          error={errors.username?.message}
          {...register("username", {
            required: "Nickname is required",
            minLength: { value: 3, message: "At least 3 characters" },
            maxLength: { value: 24, message: "At most 24 characters" },
            pattern: { value: /^[a-zA-Z0-9_.]+$/, message: "Letters, numbers, underscore, dot only" },
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Start chatting
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-gray-400">
        No account needed. Guest sessions last 24 hours and can join public rooms and direct messages — create a free account for
        friends, groups, and settings.
      </p>
    </div>
  );
}
