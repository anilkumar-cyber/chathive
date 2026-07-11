import { NotificationType } from "@nexuschat/shared";
import { Document, Schema, Types, model } from "mongoose";

export interface INotificationDocument extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: NotificationType;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    content: { type: String, required: true },
    link: String,
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotificationDocument>("Notification", notificationSchema);
