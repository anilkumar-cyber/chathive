import { MessageStatus, MessageType } from "@nexuschat/shared";
import { Document, Schema, Types, model } from "mongoose";

export interface IAttachmentSub {
  url: string;
  type: MessageType;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  publicId?: string;
}

export interface IReactionSub {
  emoji: string;
  user: Types.ObjectId;
}

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  type: MessageType;
  content: string;
  attachments: IAttachmentSub[];
  replyTo?: Types.ObjectId;
  forwardedFrom?: Types.ObjectId;
  mentions: Types.ObjectId[];
  reactions: IReactionSub[];
  status: MessageStatus;
  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  isEdited: boolean;
  editHistory: { content: string; editedAt: Date }[];
  isPinned: boolean;
  deletedFor: Types.ObjectId[];
  isDeletedForEveryone: boolean;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachmentSub>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: Object.values(MessageType), required: true },
    fileName: String,
    fileSize: Number,
    duration: Number,
    width: Number,
    height: Number,
    thumbnailUrl: String,
    publicId: String,
  },
  { _id: false }
);

const reactionSchema = new Schema<IReactionSub>(
  {
    emoji: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    content: { type: String, maxlength: 4000, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: "Message" },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: { type: [reactionSchema], default: [] },
    status: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.SENT },
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
    editHistory: { type: [{ content: String, editedAt: Date }], default: [] },
    isPinned: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeletedForEveryone: { type: Boolean, default: false },
    scheduledFor: Date,
  },
  { timestamps: true }
);

messageSchema.index({ content: "text" });
messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = model<IMessageDocument>("Message", messageSchema);
