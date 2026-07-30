import { Router } from "express";
import { doctorController } from "./doctor.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/", auth, requireRole("PATIENT", "RECEPTIONIST", "ADMIN"), doctorController.getAllDoctors);
router.get("/:id", auth, requireRole("PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"), doctorController.getDoctorById);

export const doctorRoutes = router;
