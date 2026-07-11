import { ConversationType, GroupRole, RoomCategory } from "@nexuschat/shared";
import { Document, Schema, Types, model } from "mongoose";

export interface IGroupMemberSub {
  user: Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

export interface IConversationDocument extends Document {
  _id: Types.ObjectId;
  type: ConversationType;
  participants: Types.ObjectId[];
  members: IGroupMemberSub[];
  name?: string;
  slug?: string;
  avatar?: string;
  description?: string;
  category?: RoomCategory;
  isPublic: boolean;
  createdBy?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  pinnedMessages: Types.ObjectId[];
  mutedBy: Types.ObjectId[];
  archivedBy: Types.ObjectId[];
  deletedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMemberSub>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(GroupRole), default: GroupRole.MEMBER },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversationDocument>(
  {
    type: { type: String, enum: Object.values(ConversationType), required: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    members: { type: [groupMemberSchema], default: [] },
    name: { type: String, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    avatar: String,
    description: { type: String, maxlength: 500 },
    category: { type: String, enum: Object.values(RoomCategory) },
    isPublic: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date, index: true },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    mutedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

conversationSchema.index({ name: "text", description: "text" });
conversationSchema.index({ type: 1, isPublic: 1, category: 1 });
conversationSchema.index({ participants: 1, type: 1 });

export const Conversation = model<IConversationDocument>("Conversation", conversationSchema);
