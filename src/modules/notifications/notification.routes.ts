import { Router } from "express";
import { notificationController } from "./notification.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/me", auth, notificationController.getMyNotifications);
router.post("/trigger", auth, requireRole("ADMIN"), notificationController.triggerReminderRun);

export const notificationRoutes = router;
