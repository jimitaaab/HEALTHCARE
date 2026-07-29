import { Router } from "express";
import { patientController } from "./patient.controller";
import { Role } from "../../../generated/prisma/client";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/search",
  auth(Role.DOCTOR, Role.RECEPTIONIST),
  patientController.searchPatients,
);

router.get(
  "/",
  auth(Role.RECEPTIONIST, Role.ADMIN),
  patientController.getAllPatients,
);

router.get(
  "/:id",
  auth(Role.PATIENT, Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN),
  patientController.getPatientById,
);

router.patch(
  "/:id",
  auth(Role.PATIENT, Role.ADMIN),
  patientController.updatePatient,
);

export const patientRoutes = router;
