import { Router } from "express";
import { appointmentController } from "./appointment.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  auth("DOCTOR", "RECEPTIONIST", "ADMIN"),
  appointmentController.getAppointments,
);

router.post(
  "/",
  auth("PATIENT", "RECEPTIONIST"),
  appointmentController.createAppointment,
);

router.patch(
  "/:id",
  auth("PATIENT", "RECEPTIONIST"),
  appointmentController.updateAppointment,
);

router.post(
  "/override",
  auth("RECEPTIONIST"),
  appointmentController.overrideAppointment,
);

router.post(
  "/:id/check-in",
  auth("RECEPTIONIST"),
  appointmentController.checkIn,
);

router.post(
  "/:id/check-out",
  auth("RECEPTIONIST"),
  appointmentController.checkOut,
);

export const appointmentRoutes = router;
