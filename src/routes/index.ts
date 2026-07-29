import { Router } from "express";
import { userRoutes } from "../modules/users/user.route";
import { doctorRoutes } from "../modules/doctors/doctor.route";
import { patientRoutes } from "../modules/patients/patient.route";
import { appointmentRoutes } from "../modules/appointments/appointment.route";

const router = Router();

router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
