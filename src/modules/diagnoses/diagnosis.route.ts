import { Router } from "express";
import { diagnosisController } from "./diagnosis.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.post(
  "/records/:id/diagnoses",
  auth,
  requireRole("DOCTOR"),
  diagnosisController.addDiagnosis,
);

export const diagnosisRoutes = router;
