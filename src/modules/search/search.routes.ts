import { Router } from "express";
import { searchController } from "./search.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get(
  "/patients",
  auth,
  requireRole("DOCTOR", "RECEPTIONIST"),
  searchController.searchPatients,
);

router.get(
  "/appointments",
  auth,
  requireRole("DOCTOR", "RECEPTIONIST"),
  searchController.searchAppointments,
);

export const searchRoutes = router;
