import { FriendRequestStatus } from "@nexuschat/shared";
import { Document, Schema, Types, model } from "mongoose";

export interface IFriendRequestDocument extends Document {
  _id: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequestDocument>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: Object.values(FriendRequestStatus), default: FriendRequestStatus.PENDING },
  },
  { timestamps: true }
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export const FriendRequest = model<IFriendRequestDocument>("FriendRequest", friendRequestSchema);
