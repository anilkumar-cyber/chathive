import { ProfilePrivacy, UserRole, UserStatus } from "@nexuschat/shared";
import bcrypt from "bcryptjs";
import { Document, Schema, Types, model } from "mongoose";
import { env } from "../config/env";

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  username: string;
  email?: string;
  password?: string;
  isGuest: boolean;
  guestExpiresAt?: Date;
  googleId?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  country?: string;
  state?: string;
  city?: string;
  languages: string[];
  interests: string[];
  profession?: string;
  role: UserRole;
  status: UserStatus;
  customStatus?: string;
  lastSeen: Date;
  isVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profilePrivacy: ProfilePrivacy;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  fcmTokens: string[];
  blockedUsers: Types.ObjectId[];
  mutedUsers: Types.ObjectId[];
  bestFriends: Types.ObjectId[];
  isBanned: boolean;
  banReason?: string;
  isSuspended: boolean;
  suspendedUntil?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  isLocked: boolean;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-zA-Z0-9_.]+$/,
    },
    email: {
      type: String,
      required: [function (this: IUserDocument) { return !this.isGuest; }, "Email is required"],
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, select: false },
    isGuest: { type: Boolean, default: false },
    guestExpiresAt: { type: Date },
    avatar: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    bio: { type: String, maxlength: 300, default: "" },
    age: { type: Number, min: 13, max: 120 },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    country: String,
    state: String,
    city: String,
    languages: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    profession: String,
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.OFFLINE },
    customStatus: { type: String, maxlength: 100 },
    lastSeen: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    profilePrivacy: { type: String, enum: Object.values(ProfilePrivacy), default: ProfilePrivacy.PUBLIC },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    fcmTokens: { type: [String], default: [] },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    mutedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bestFriends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isBanned: { type: Boolean, default: false },
    banReason: String,
    isSuspended: { type: Boolean, default: false },
    suspendedUntil: Date,
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ username: "text", email: "text" });
userSchema.index({ country: 1, age: 1, gender: 1 });
userSchema.index({ status: 1 });
userSchema.index({ guestExpiresAt: 1 }, { expireAfterSeconds: 0 });

userSchema.virtual("isLocked").get(function (this: IUserDocument) {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.emailVerificationToken;
    delete obj.passwordResetToken;
    delete obj.twoFactorSecret;
    delete obj.__v;
    return obj;
  },
});

export const User = model<IUserDocument>("User", userSchema);
