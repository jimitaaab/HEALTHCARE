import { Router } from "express";
import { diagnosisController } from "./diagnosis.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/records/:id/diagnoses",
  auth("DOCTOR"),
  diagnosisController.addDiagnosis,
);

export const diagnosisRoutes = router;
