import { Router } from "express";
import { doctorController } from "./doctor.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get("/", auth("PATIENT", "RECEPTIONIST", "ADMIN"), doctorController.getAllDoctors);
router.get("/:id", auth("PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"), doctorController.getDoctorById);

export const doctorRoutes = router;
