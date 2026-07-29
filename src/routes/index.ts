import { Router } from "express";
import { userRoutes } from "../modules/users/user.route";
import { doctorRoutes } from "../modules/doctors/doctor.route";
import { appointmentRoutes } from "../modules/appoinments/appointment.route";

const router = Router();

router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
