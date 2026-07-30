import { Router } from "express";
import { medicalRecordController } from "./medicalRecord.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/:id/history",
  auth,
  requireRole("PATIENT", "DOCTOR"),
  medicalRecordController.getPatientHistory,
);

router.post(
  "/:id/records",
  auth,
  requireRole("DOCTOR"),
  medicalRecordController.createMedicalRecord,
);

export const medicalRecordRoutes = router;
