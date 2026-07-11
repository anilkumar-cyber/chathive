import { UserRole } from "@nexuschat/shared";
import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.MODERATOR));

router.get("/dashboard", adminController.getDashboardStats);
router.get("/users", adminController.listUsers);
router.post("/users/:id/ban", adminController.banUser);
router.post("/users/:id/unban", adminController.unbanUser);
router.post("/users/:id/suspend", adminController.suspendUser);
router.post("/users/:id/unsuspend", adminController.unsuspendUser);
router.post("/block-ip", authorize(UserRole.ADMIN), adminController.blockUserIp);

router.get("/reports", adminController.listReports);
router.patch("/reports/:id", adminController.resolveReport);

router.get("/blocked-words", adminController.listBlockedWords);
router.post("/blocked-words", adminController.addBlockedWord);
router.delete("/blocked-words/:id", adminController.removeBlockedWord);

router.get("/rooms", adminController.listRoomsAdmin);
router.delete("/rooms/:id", authorize(UserRole.ADMIN), adminController.deleteRoomAdmin);

router.get("/audit-logs", authorize(UserRole.ADMIN), adminController.getAuditLogs);

export default router;
