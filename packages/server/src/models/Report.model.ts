import { ReportStatus } from "@nexuschat/shared";
import { Document, Schema, Types, model } from "mongoose";

export interface IReportDocument extends Document {
  _id: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reportedUser?: Types.ObjectId;
  reportedMessage?: Types.ObjectId;
  reason: string;
  details?: string;
  status: ReportStatus;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User" },
    reportedMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    reason: { type: String, required: true },
    details: String,
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.PENDING, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Report = model<IReportDocument>("Report", reportSchema);
