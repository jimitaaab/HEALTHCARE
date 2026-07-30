import { Router } from "express";
import { doctorController } from "./doctor.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/", auth, requireRole("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"), doctorController.getAllDoctors);
router.get("/me", auth, requireRole("DOCTOR"), doctorController.getMyProfile);
router.put("/me", auth, requireRole("DOCTOR"), doctorController.updateMyProfile);
router.get("/me/schedule", auth, requireRole("DOCTOR"), doctorController.getMySchedule);
router.get("/me/appointments", auth, requireRole("DOCTOR"), doctorController.getMyAppointments);
router.get("/:id", auth, requireRole("PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"), doctorController.getDoctorById);

export const doctorRoutes = router;
