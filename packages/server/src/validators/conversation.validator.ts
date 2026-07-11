import { RoomCategory } from "@nexuschat/shared";
import { z } from "zod";

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    memberIds: z.array(z.string()).min(1).max(499),
  }),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    avatar: z.string().optional(),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    category: z.nativeEnum(RoomCategory).default(RoomCategory.CUSTOM),
    isPublic: z.boolean().default(true),
  }),
});

export const addMembersSchema = z.object({
  body: z.object({
    memberIds: z.array(z.string()).min(1).max(100),
  }),
});
