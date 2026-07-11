import { Document, Schema, Types, model } from "mongoose";

export interface IAuditLogDocument extends Document {
  actor?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: String,
    meta: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLogDocument>("AuditLog", auditLogSchema);
