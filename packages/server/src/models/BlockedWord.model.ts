import { Document, Schema, model } from "mongoose";

export interface IBlockedWordDocument extends Document {
  word: string;
  createdAt: Date;
}

const blockedWordSchema = new Schema<IBlockedWordDocument>(
  { word: { type: String, required: true, unique: true, lowercase: true, trim: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BlockedWord = model<IBlockedWordDocument>("BlockedWord", blockedWordSchema);
