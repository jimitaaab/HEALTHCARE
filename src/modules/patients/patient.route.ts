import { Router } from "express";
import { patientController } from "./patient.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/search",
  auth("DOCTOR", "RECEPTIONIST"),
  patientController.searchPatients,
);

router.get(
  "/",
  auth("RECEPTIONIST", "ADMIN"),
  patientController.getAllPatients,
);

router.get(
  "/:id",
  auth("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"),
  patientController.getPatientById,
);

router.patch(
  "/:id",
  auth("PATIENT", "ADMIN"),
  patientController.updatePatient,
);

export const patientRoutes = router;
