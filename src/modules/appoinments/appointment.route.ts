import { Router } from "express";
import { appointmentController } from "./appointment.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  auth(Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN),
  appointmentController.getAppointments,
);

router.post(
  "/",
  auth(Role.PATIENT, Role.RECEPTIONIST),
  appointmentController.createAppointment,
);

router.patch(
  "/:id",
  auth(Role.PATIENT, Role.RECEPTIONIST),
  appointmentController.updateAppointment,
);

router.post(
  "/:id/override",
  auth(Role.RECEPTIONIST),
  appointmentController.overrideAppointment,
);

router.post(
  "/:id/check-in",
  auth(Role.RECEPTIONIST),
  appointmentController.checkIn,
);

router.post(
  "/:id/check-out",
  auth(Role.RECEPTIONIST),
  appointmentController.checkOut,
);

export const appointmentRoutes = router;
