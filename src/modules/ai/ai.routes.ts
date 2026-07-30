import { Router } from "express";
import { aiController } from "./ai.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.post(
  "/symptom-check",
  auth,
  requireRole("PATIENT"),
  aiController.symptomCheck,
);

export const aiRoutes = router;
