import { Router } from "express";
import { insuranceController } from "./insurance.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/", auth, requireRole("RECEPTIONIST"), insuranceController.getAllClaims);
router.post("/", auth, requireRole("RECEPTIONIST"), insuranceController.createClaim);
router.put("/:id", auth, requireRole("RECEPTIONIST"), insuranceController.updateClaimStatus);
router.get("/me", auth, requireRole("PATIENT"), insuranceController.getMyClaims);

export const insuranceRoutes = router;
