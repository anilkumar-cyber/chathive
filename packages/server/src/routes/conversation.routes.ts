import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller";
import * as messageController from "../controllers/message.controller";
import { authenticate, blockGuests } from "../middlewares/auth.middleware";
import { messageLimiter } from "../middlewares/rateLimit.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  addMembersSchema,
  createGroupSchema,
  createRoomSchema,
  updateGroupSchema,
} from "../validators/conversation.validator";

const router = Router();
router.use(authenticate);

router.get("/", conversationController.listConversations);
router.get("/search-messages", messageController.searchMessages);

router.post("/private/:userId", conversationController.startPrivateConversation);

const guestsCantGroup = blockGuests("Create a free account to use group chats");

router.post("/groups", guestsCantGroup, validate(createGroupSchema), conversationController.createGroup);
router.patch("/groups/:id", guestsCantGroup, validate(updateGroupSchema), conversationController.updateGroup);
router.post("/groups/:id/avatar", guestsCantGroup, upload.single("avatar"), conversationController.uploadGroupAvatar);
router.post("/groups/:id/members", guestsCantGroup, validate(addMembersSchema), conversationController.addMembers);
router.delete("/groups/:id/members/:userId", guestsCantGroup, conversationController.removeMember);
router.post("/groups/:id/leave", guestsCantGroup, conversationController.leaveGroup);

router.get("/rooms", conversationController.listRooms);
router.post("/rooms", blockGuests("Create a free account to create rooms"), validate(createRoomSchema), conversationController.createRoom);
router.post("/rooms/:id/join", conversationController.joinRoom);
router.post("/rooms/:id/leave", conversationController.leaveRoom);

router.get("/:id", conversationController.getConversation);
router.post("/:id/archive", conversationController.archiveConversation);
router.delete("/:id", conversationController.deleteConversationForMe);
router.post("/:id/mute", conversationController.muteConversation);
router.delete("/:id/mute", conversationController.unmuteConversation);

router.get("/:conversationId/messages", messageController.getMessages);
router.post("/:conversationId/messages", messageLimiter, messageController.sendMessage);
router.post("/:conversationId/messages/attachment", messageLimiter, upload.single("file"), messageController.uploadAttachmentMessage);

export default router;
