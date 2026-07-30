import { Router } from "express";
import { patientController } from "./patient.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/me",
  auth,
  requireRole("PATIENT"),
  patientController.getMyProfile,
);

router.put(
  "/me",
  auth,
  requireRole("PATIENT"),
  patientController.updateMyProfile,
);

router.get(
  "/me/appointments",
  auth,
  requireRole("PATIENT"),
  patientController.getMyAppointments,
);

router.post(
  "/me/appointments",
  auth,
  requireRole("PATIENT"),
  patientController.bookAppointment,
);

router.put(
  "/me/appointments/:id",
  auth,
  requireRole("PATIENT"),
  patientController.rescheduleAppointment,
);

router.delete(
  "/me/appointments/:id",
  auth,
  requireRole("PATIENT"),
  patientController.cancelMyAppointment,
);

router.get(
  "/search",
  auth,
  requireRole("DOCTOR", "RECEPTIONIST"),
  patientController.searchPatients,
);

router.get(
  "/",
  auth,
  requireRole("RECEPTIONIST", "ADMIN"),
  patientController.getAllPatients,
);

router.get(
  "/:id",
  auth,
  requireRole("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"),
  patientController.getPatientById,
);

router.patch(
  "/:id",
  auth,
  requireRole("PATIENT", "ADMIN"),
  patientController.updatePatient,
);

export const patientRoutes = router;
