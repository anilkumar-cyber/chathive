import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", searchController.globalSearch);
router.get("/users", userController.searchUsers);
router.get("/groups", searchController.searchGroups);
router.get("/rooms", searchController.searchRooms);

export default router;
