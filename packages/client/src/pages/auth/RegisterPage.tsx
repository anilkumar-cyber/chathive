import { useForm } from "react-hook-form";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "@/api/auth.api";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const navigate = useNavigate();

  async function onSubmit(values: FormValues) {
    try {
      await registerApi(values);
      toast.success("Account created! Check your email to verify your account.");
      navigate("/login");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Registration failed"));
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">Join the conversation in seconds.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Username"
          icon={<FiUser size={16} />}
          placeholder="johndoe"
          error={errors.username?.message}
          {...register("username", {
            required: "Username is required",
            minLength: { value: 3, message: "At least 3 characters" },
            maxLength: { value: 24, message: "At most 24 characters" },
            pattern: { value: /^[a-zA-Z0-9_.]+$/, message: "Letters, numbers, underscore, dot only" },
          })}
        />
        <Input
          label="Email"
          type="email"
          icon={<FiMail size={16} />}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <Input
          label="Password"
          type="password"
          icon={<FiLock size={16} />}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: "Needs uppercase, lowercase, and a number",
            },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          icon={<FiLock size={16} />}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (v) => v === watch("password") || "Passwords do not match",
          })}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
