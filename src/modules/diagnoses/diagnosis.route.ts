import { Router } from "express";
import { diagnosisController } from "./diagnosis.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/records/:id/diagnoses",
  auth(Role.DOCTOR),
  diagnosisController.addDiagnosis,
);

export const diagnosisRoutes = router;
