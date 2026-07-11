import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { authenticate, blockGuests } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate, blockGuests("Create a free account to use settings"));

router.post("/fcm-token", settingsController.registerFcmToken);
router.delete("/fcm-token", settingsController.removeFcmToken);

router.post("/2fa/setup", settingsController.setup2FA);
router.post("/2fa/confirm", settingsController.confirm2FA);
router.post("/2fa/disable", settingsController.disable2FA);

router.get("/blocked-users", settingsController.getBlockedUsers);

export default router;
