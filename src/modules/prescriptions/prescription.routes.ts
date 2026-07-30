import { Router } from "express";
import { prescriptionController } from "./prescription.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/me", auth, requireRole("PATIENT"), prescriptionController.getMyPrescriptions);
router.post("/me/:id/refill", auth, requireRole("PATIENT"), prescriptionController.requestRefill);
router.post("/", auth, requireRole("DOCTOR"), prescriptionController.createPrescription);

export const prescriptionRoutes = router;
