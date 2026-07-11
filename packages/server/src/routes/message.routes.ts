import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import * as messageController from "../controllers/message.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.patch("/:id", messageController.editMessage);
router.delete("/:id", messageController.deleteMessage);
router.post("/:id/react", messageController.reactToMessage);
router.post("/:id/pin", messageController.togglePinMessage);
router.post("/:id/report", (req, res, next) => {
  req.body.reportedMessage = req.params.id;
  next();
}, adminController.createReport);

export default router;
