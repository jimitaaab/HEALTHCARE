import { Router } from "express";
import { receptionistController } from "./receptionist.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/appointments", auth, requireRole("RECEPTIONIST"), receptionistController.getAppointments);
router.put("/appointments/:id", auth, requireRole("RECEPTIONIST"), receptionistController.editAppointment);
router.put("/appointments/:id/check-in", auth, requireRole("RECEPTIONIST"), receptionistController.checkIn);
router.put("/appointments/:id/check-out", auth, requireRole("RECEPTIONIST"), receptionistController.checkOut);

export const receptionistRoutes = router;
