import { Document, Schema, Types, model } from "mongoose";

export interface IRefreshTokenDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  family: string;
  userAgent?: string;
  ip?: string;
  revoked: boolean;
  replacedByHash?: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    userAgent: String,
    ip: String,
    revoked: { type: Boolean, default: false },
    replacedByHash: String,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshTokenDocument>("RefreshToken", refreshTokenSchema);
