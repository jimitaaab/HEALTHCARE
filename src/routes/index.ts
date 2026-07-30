import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { doctorRoutes } from "../modules/doctors/doctor.route";
import { patientRoutes } from "../modules/patients/patient.route";
import { appointmentRoutes } from "../modules/appointments/appointment.route";
import { medicalRecordRoutes } from "../modules/medical-records/medicalRecord.route";
import { insuranceRoutes } from "../modules/insurance/insurance.route";
import { notificationRoutes } from "../modules/notifications/notification.routes";
import { prescriptionRoutes } from "../modules/prescriptions/prescription.routes";
import { receptionistRoutes } from "../modules/receptionist/receptionist.routes";
import { searchRoutes } from "../modules/search/search.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/insurance", insuranceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/receptionist", receptionistRoutes);
router.use("/search", searchRoutes);

export default router;
