import { Router } from "express";
import { medicalRecordController } from "./medicalRecord.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/:id/history",
  auth(Role.PATIENT, Role.DOCTOR),
  medicalRecordController.getPatientHistory,
);

router.post(
  "/:id/records",
  auth(Role.DOCTOR),
  medicalRecordController.createMedicalRecord,
);

export const medicalRecordRoutes = router;
