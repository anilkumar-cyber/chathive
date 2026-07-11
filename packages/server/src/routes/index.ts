import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import conversationRoutes from "./conversation.routes";
import friendRoutes from "./friend.routes";
import messageRoutes from "./message.routes";
import notificationRoutes from "./notification.routes";
import searchRoutes from "./search.routes";
import settingsRoutes from "./settings.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/friends", friendRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);
router.use("/settings", settingsRoutes);
router.use("/admin", adminRoutes);

export default router;
