import { Router } from "express";
import { googleAuthEnabled } from "../config/env";
import { passport } from "../config/passport";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authLimiter, passwordResetLimiter } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  forgotPasswordSchema,
  guestLoginSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *     responses:
 *       201: { description: Registered, verification email sent }
 */
router.post("/register", authLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 */
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email/username + password
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/guest:
 *   post:
 *     tags: [Auth]
 *     summary: Start a temporary guest session (nickname only, no email/password). Expires after 24h.
 */
router.post("/guest", authLimiter, validate(guestLoginSchema), authController.guestLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token, issue new access token
 */
router.post("/refresh", validate(refreshSchema), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 */
router.post("/forgot-password", passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 */
router.post("/reset-password", passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 */
router.get("/me", authenticate, authController.me);

if (googleAuthEnabled) {
  router.get("/google", (req, res, next) => {
    passport.authenticate("google", { scope: ["profile", "email"], session: false, state: (req.query.redirect as string) || "" })(
      req,
      res,
      next
    );
  });

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    authController.googleCallback
  );
}

export default router;
