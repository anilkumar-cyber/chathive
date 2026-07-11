import { Router } from "express";
import * as friendController from "../controllers/friend.controller";
import { authenticate, blockGuests } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate, blockGuests("Create a free account to add friends"));

router.get("/", friendController.listFriends);
router.get("/requests", friendController.listPendingRequests);
router.post("/requests/:userId", friendController.sendRequest);
router.post("/requests/:requestId/accept", friendController.acceptRequest);
router.post("/requests/:requestId/reject", friendController.rejectRequest);
router.delete("/requests/:requestId", friendController.cancelRequest);
router.delete("/:userId", friendController.removeFriend);

export default router;
