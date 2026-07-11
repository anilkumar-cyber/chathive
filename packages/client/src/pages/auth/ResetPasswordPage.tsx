import { useForm } from "react-hook-form";
import { FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/api/auth.api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Missing or invalid reset token");
      return;
    }
    try {
      await resetPassword(token, values.password, values.confirmPassword);
      toast.success("Password reset. Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Reset link is invalid or expired"));
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">Reset your password</h1>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">Choose a strong new password.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={<FiLock size={16} />}
          error={errors.password?.message}
          {...register("password", { required: true, minLength: 8 })}
        />
        <Input
          label="Confirm new password"
          type="password"
          icon={<FiLock size={16} />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: true,
            validate: (v) => v === watch("password") || "Passwords do not match",
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset password
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
