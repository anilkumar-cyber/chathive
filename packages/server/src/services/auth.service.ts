import { UserRole, UserStatus } from "@nexuschat/shared";
import { Request } from "express";
import { RefreshToken, User } from "../models";
import { IUserDocument } from "../models/User.model";
import { ApiError } from "../utils/ApiError";
import { resetPasswordEmailTemplate, sendEmail, verificationEmailTemplate } from "../utils/email";
import { addDuration, generateOpaqueToken, hashToken, signAccessToken } from "../utils/tokens";
import { env } from "../config/env";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
export const GUEST_SESSION_TTL = "24h";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function issueTokenPair(
  user: IUserDocument,
  meta: { userAgent?: string; ip?: string; rememberMe?: boolean; family?: string; ttlOverride?: string }
): Promise<TokenPair> {
  const accessToken = signAccessToken(user._id, user.role);
  const { raw, hash } = generateOpaqueToken();
  const family = meta.family ?? generateOpaqueToken().raw;
  const ttl = meta.ttlOverride ?? (meta.rememberMe ? env.JWT_REMEMBER_REFRESH_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hash,
    family,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: addDuration(new Date(), ttl),
  });

  return { accessToken, refreshToken: `${family}.${raw}` };
}

export async function rotateRefreshToken(rawCombined: string, meta: { userAgent?: string; ip?: string }): Promise<TokenPair> {
  const [family, raw] = rawCombined.split(".");
  if (!family || !raw) throw ApiError.unauthorized("Invalid refresh token");

  const hash = hashToken(raw);
  const existing = await RefreshToken.findOne({ tokenHash: hash, family });

  if (!existing) {
    // Possible token reuse attack: invalidate whole family defensively.
    await RefreshToken.updateMany({ family }, { revoked: true });
    throw ApiError.unauthorized("Invalid refresh token");
  }

  if (existing.revoked || existing.expiresAt < new Date()) {
    await RefreshToken.updateMany({ family }, { revoked: true });
    throw ApiError.unauthorized("Refresh token expired or already used");
  }

  const user = await User.findById(existing.user);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  existing.revoked = true;
  const { raw: newRaw, hash: newHash } = generateOpaqueToken();
  existing.replacedByHash = newHash;
  await existing.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: newHash,
    family,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: existing.expiresAt,
  });

  const accessToken = signAccessToken(user._id, user.role);
  return { accessToken, refreshToken: `${family}.${newRaw}` };
}

export async function revokeRefreshFamily(rawCombined: string): Promise<void> {
  const [family] = rawCombined.split(".");
  if (!family) return;
  await RefreshToken.updateMany({ family }, { revoked: true });
}

export async function registerUser(username: string, email: string, password: string): Promise<IUserDocument> {
  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
  if (existing) {
    throw ApiError.conflict(existing.email === email.toLowerCase() ? "Email already registered" : "Username already taken");
  }

  const user = await User.create({ username, email: email.toLowerCase(), password, role: UserRole.USER });

  const { raw, hash } = generateOpaqueToken();
  user.emailVerificationToken = hash;
  user.emailVerificationExpires = addDuration(new Date(), "24h");
  await user.save();

  const verifyLink = `${env.CLIENT_URL}/verify-email?token=${raw}`;
  await sendEmail(user.email as string, "Verify your NexusChat account", verificationEmailTemplate(user.username, verifyLink));

  return user;
}

export async function createGuestUser(requestedUsername: string): Promise<IUserDocument> {
  const base = requestedUsername.trim();

  const taken = await User.exists({ username: base });
  if (taken) throw ApiError.conflict("That username is taken. Try another.");

  return User.create({
    username: base,
    isGuest: true,
    isVerified: true,
    role: UserRole.USER,
    status: UserStatus.ONLINE,
    guestExpiresAt: addDuration(new Date(), GUEST_SESSION_TTL),
  });
}

export async function verifyEmailToken(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken);
  const user = await User.findOne({
    emailVerificationToken: hash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) throw ApiError.badRequest("Verification link is invalid or expired");

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
}

export async function authenticateCredentials(emailOrUsername: string, password: string): Promise<IUserDocument> {
  const user = await User.findOne({
    $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
  }).select("+password +loginAttempts +lockUntil +twoFactorSecret");

  if (!user) throw ApiError.unauthorized("Invalid credentials");

  if (user.isLocked) {
    throw ApiError.forbidden("Account temporarily locked due to too many failed attempts. Try again later.");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      user.loginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (user.isBanned) throw ApiError.forbidden("Account banned");
  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw ApiError.forbidden("Account suspended");
  }
  if (!user.isVerified) throw ApiError.forbidden("Please verify your email before logging in");

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.status = UserStatus.ONLINE;
  user.lastSeen = new Date();
  await user.save();

  return user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase(), isGuest: false });
  if (!user) return; // do not leak account existence

  const { raw, hash } = generateOpaqueToken();
  user.passwordResetToken = hash;
  user.passwordResetExpires = addDuration(new Date(), "1h");
  await user.save();

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${raw}`;
  await sendEmail(user.email as string, "Reset your NexusChat password", resetPasswordEmailTemplate(user.username, resetLink));
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const hash = hashToken(rawToken);
  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw ApiError.badRequest("Reset link is invalid or expired");

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
}

export function extractClientMeta(req: Request): { userAgent?: string; ip?: string } {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}
