import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/admin/signup", authController.adminSignup);
router.post("/admin/login", authController.adminLogin);

export const authRoutes = router;
