import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateProfileSchema, updateStatusSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/search", userController.searchUsers);
router.get("/online", userController.getOnlineUsers);
router.get("/recent", userController.getRecentlyJoined);

router.patch("/me", validate(updateProfileSchema), userController.updateProfile);
router.patch("/me/status", validate(updateStatusSchema), userController.updateStatus);
router.post("/me/avatar", upload.single("avatar"), userController.uploadAvatar);
router.post("/me/cover", upload.single("cover"), userController.uploadCoverPhoto);
router.delete("/me", userController.deleteAccount);
router.get("/me/data-export", userController.downloadMyData);

router.post("/:id/block", userController.blockUser);
router.delete("/:id/block", userController.unblockUser);
router.post("/:id/mute", userController.muteUser);
router.delete("/:id/mute", userController.unmuteUser);
router.post("/:id/best-friend", userController.addBestFriend);
router.delete("/:id/best-friend", userController.removeBestFriend);

router.get("/:id", userController.getUserById);

export default router;
