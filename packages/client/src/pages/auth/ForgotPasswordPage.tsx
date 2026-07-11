import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiMail } from "react-icons/fi";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/api/auth.api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [sent, setSent] = useState(false);

  async function onSubmit(values: FormValues) {
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Check your inbox</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          If an account exists for that email, we sent a link to reset your password.
        </p>
        <Link to="/login" className="text-sm font-medium text-brand-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">Forgot password?</h1>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={<FiMail size={16} />}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="font-medium text-brand-500 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
