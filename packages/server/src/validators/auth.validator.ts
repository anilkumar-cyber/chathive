import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3)
        .max(24)
        .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscore and dot allowed"),
      email: z.string().email(),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().min(3),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
    twoFactorCode: z.string().length(6).optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(10),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(10) }),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().optional() }),
});

export const guestLoginSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscore and dot allowed"),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});
