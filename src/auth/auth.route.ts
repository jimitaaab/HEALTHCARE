import { Router } from "express";
import { authController } from "./auth.controller";
import { Role } from "../../generated/prisma/client";
import auth from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post(
  "/logout",
  auth(Role.PATIENT, Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN),
  authController.logout,
);
router.post("/refresh-token", authController.refreshToken);

export const authRoutes = router;
