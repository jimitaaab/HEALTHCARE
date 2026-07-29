import { Router } from "express";
import { doctorController } from "./doctor.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get("/", auth(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN), doctorController.getAllDoctors);
router.get("/:id", auth(Role.PATIENT, Role.RECEPTIONIST, Role.DOCTOR, Role.ADMIN), doctorController.getDoctorById);
router.get("/:id/availability", auth(Role.PATIENT, Role.RECEPTIONIST), doctorController.getAvailability);

export const doctorRoutes = router;
