import { Router } from "express";
import { appointmentController } from "./appointment.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  auth,
  requireRole("DOCTOR", "RECEPTIONIST", "ADMIN"),
  appointmentController.getAppointments,
);

router.post(
  "/",
  auth,
  requireRole("PATIENT", "RECEPTIONIST"),
  appointmentController.createAppointment,
);

router.patch(
  "/:id",
  auth,
  requireRole("PATIENT", "RECEPTIONIST"),
  appointmentController.updateAppointment,
);

router.post(
  "/override",
  auth,
  requireRole("RECEPTIONIST"),
  appointmentController.overrideAppointment,
);

router.delete(
  "/:id",
  auth,
  requireRole("PATIENT", "RECEPTIONIST"),
  appointmentController.cancelAppointment,
);

router.post(
  "/:id/check-in",
  auth,
  requireRole("RECEPTIONIST"),
  appointmentController.checkIn,
);

router.post(
  "/:id/check-out",
  auth,
  requireRole("RECEPTIONIST"),
  appointmentController.checkOut,
);

export const appointmentRoutes = router;
