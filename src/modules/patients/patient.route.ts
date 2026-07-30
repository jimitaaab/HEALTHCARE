import { Router } from "express";
import { patientController } from "./patient.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

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
