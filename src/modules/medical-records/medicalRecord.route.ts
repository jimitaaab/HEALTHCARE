import { Router } from "express";
import { medicalRecordController } from "./medicalRecord.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/me",
  auth,
  requireRole("PATIENT"),
  medicalRecordController.getMyHistory,
);

router.get(
  "/patient/:patientId",
  auth,
  requireRole("DOCTOR"),
  medicalRecordController.getPatientHistory,
);

router.post(
  "/patient/:patientId",
  auth,
  requireRole("DOCTOR"),
  medicalRecordController.createMedicalRecord,
);

router.post(
  "/:recordId/diagnoses",
  auth,
  requireRole("DOCTOR"),
  medicalRecordController.addDiagnosis,
);

export const medicalRecordRoutes = router;
