import jwt from "jsonwebtoken";
import config from "../config/env";

export const createAuthToken = (
  overrides: Partial<{ id: string; email: string; role: string }> = {},
): string => {
  const payload = {
    id: overrides.id ?? "test-id-12345",
    email: overrides.email ?? "test@example.com",
    role: overrides.role ?? "PATIENT",
  };
  return jwt.sign(payload, config.jwt_access_Secret, {
    expiresIn: "1h",
  });
};

export const createPatientToken = () =>
  createAuthToken({ id: "patient-id-1", email: "patient@test.com", role: "PATIENT" });

export const createDoctorToken = () =>
  createAuthToken({ id: "doctor-id-1", email: "doctor@test.com", role: "DOCTOR" });

export const createAdminToken = () =>
  createAuthToken({ id: "admin-id-1", email: "admin@test.com", role: "ADMIN" });

export const createReceptionistToken = () =>
  createAuthToken({ id: "receptionist-id-1", email: "receptionist@test.com", role: "RECEPTIONIST" });

export const mockUUIDs = {
  patientId: "patient-id-1",
  doctorId: "doctor-id-1",
  adminId: "admin-id-1",
  receptionistId: "receptionist-id-1",
  appointmentId: "appointment-id-1",
  recordId: "record-id-1",
  diagnosisId: "diagnosis-id-1",
  prescriptionId: "prescription-id-1",
  claimId: "claim-id-1",
};

export const mockDate = new Date("2025-06-15T10:00:00.000Z");
export const mockDateString = mockDate.toISOString();
