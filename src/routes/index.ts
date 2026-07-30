import { Router } from "express";
import { doctorRoutes } from "../modules/doctors/doctor.route";
import { patientRoutes } from "../modules/patients/patient.route";
import { appointmentRoutes } from "../modules/appointments/appointment.route";
import { medicalRecordRoutes } from "../modules/medical-records/medicalRecord.route";
import { diagnosisRoutes } from "../modules/diagnoses/diagnosis.route";

const router = Router();

router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/patients", medicalRecordRoutes);
router.use("/", diagnosisRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
