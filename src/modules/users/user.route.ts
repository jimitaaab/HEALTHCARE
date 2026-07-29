import { Router } from "express";
import { userController } from "./user.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get("/", auth(Role.ADMIN), userController.getUsers);
router.post("/", auth(Role.ADMIN), userController.createUser);
router.patch("/:id", auth(Role.ADMIN), userController.updateUser);

export const userRoutes = router;
