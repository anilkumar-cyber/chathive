import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  tokenVersion?: number;
}

export function signAccessToken(userId: Types.ObjectId | string, role: string): string {
  const payload: AccessTokenPayload = { sub: userId.toString(), role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function addDuration(from: Date, duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  const date = new Date(from);
  if (!match) return date;
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 0;
  date.setTime(date.getTime() + value * multiplier);
  return date;
}
