import { Router } from "express";
import { adminController } from "./admin.controller";
import auth from "../../middleware/auth.middleware";
import requireRole from "../../middleware/role.middleware";

const router = Router();

router.get("/users", auth, requireRole("ADMIN"), adminController.listUsers);
router.post("/users/:role", auth, requireRole("ADMIN"), adminController.createUser);
router.put("/users/:role/:id", auth, requireRole("ADMIN"), adminController.updateUser);
router.delete("/users/:role/:id", auth, requireRole("ADMIN"), adminController.deleteUser);

router.get(
  "/analytics/demographics",
  auth,
  requireRole("ADMIN"),
  adminController.demographicsAnalytics,
);
router.get(
  "/analytics/diagnoses",
  auth,
  requireRole("ADMIN"),
  adminController.diagnosesAnalytics,
);
router.get(
  "/analytics/appointments",
  auth,
  requireRole("ADMIN"),
  adminController.appointmentsAnalytics,
);

export const adminRoutes = router;
