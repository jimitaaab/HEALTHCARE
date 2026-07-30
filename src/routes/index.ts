import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { doctorRoutes } from "../modules/doctors/doctor.route";
import { patientRoutes } from "../modules/patients/patient.route";
import { appointmentRoutes } from "../modules/appointments/appointment.route";
import { medicalRecordRoutes } from "../modules/medical-records/medicalRecord.route";
import { insuranceRoutes } from "../modules/insurance/insurance.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/insurance", insuranceRoutes);

export default router;
