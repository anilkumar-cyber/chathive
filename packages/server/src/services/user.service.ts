import { ProfilePrivacy } from "@nexuschat/shared";
import { FilterQuery } from "mongoose";
import { User } from "../models";
import { IUserDocument } from "../models/User.model";
import { paginate } from "../utils/ApiResponse";

export interface SearchUsersParams {
  q?: string;
  country?: string;
  gender?: string;
  minAge?: string;
  maxAge?: string;
  language?: string;
  onlineOnly?: string;
  page?: string;
  limit?: string;
  excludeId?: string;
}

export async function searchUsers(params: SearchUsersParams) {
  const { page, limit, skip } = paginate(params.page, params.limit);
  const filter: FilterQuery<IUserDocument> = {
    profilePrivacy: { $ne: ProfilePrivacy.PRIVATE },
    isBanned: false,
  };

  if (params.excludeId) filter._id = { $ne: params.excludeId };
  if (params.q) filter.$text = { $search: params.q };
  if (params.country) filter.country = params.country;
  if (params.gender) filter.gender = params.gender;
  if (params.language) filter.languages = params.language;
  if (params.onlineOnly === "true") filter.status = { $ne: "offline" };
  if (params.minAge || params.maxAge) {
    filter.age = {};
    if (params.minAge) filter.age.$gte = Number(params.minAge);
    if (params.maxAge) filter.age.$lte = Number(params.maxAge);
  }

  const [items, total] = await Promise.all([
    User.find(filter).select("-blockedUsers -mutedUsers -fcmTokens").skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getRecentlyJoined(limit = 20) {
  return User.find({ isBanned: false, profilePrivacy: { $ne: ProfilePrivacy.PRIVATE } })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function getOnlineUsers(limit = 50) {
  return User.find({ status: { $ne: "offline" }, isBanned: false }).limit(limit);
}
