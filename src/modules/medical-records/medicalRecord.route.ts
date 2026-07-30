import { Router } from "express";
import { medicalRecordController } from "./medicalRecord.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/:id/history",
  auth("PATIENT", "DOCTOR"),
  medicalRecordController.getPatientHistory,
);

router.post(
  "/:id/records",
  auth("DOCTOR"),
  medicalRecordController.createMedicalRecord,
);

export const medicalRecordRoutes = router;
