import { ProfilePrivacy } from "@nexuschat/shared";
import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_.]+$/).optional(),
    bio: z.string().max(300).optional(),
    age: z.number().int().min(13).max(120).optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    country: z.string().max(60).optional(),
    state: z.string().max(60).optional(),
    city: z.string().max(60).optional(),
    languages: z.array(z.string()).max(10).optional(),
    interests: z.array(z.string()).max(20).optional(),
    profession: z.string().max(100).optional(),
    customStatus: z.string().max(100).optional(),
    profilePrivacy: z.nativeEnum(ProfilePrivacy).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["online", "away", "busy", "invisible"]),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    country: z.string().optional(),
    gender: z.string().optional(),
    minAge: z.string().optional(),
    maxAge: z.string().optional(),
    language: z.string().optional(),
    onlineOnly: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
