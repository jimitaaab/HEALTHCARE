import { jest, beforeEach, describe, it, expect } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";
import jwt from "jsonwebtoken";
import config from "../../../config/env";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");

const createToken = (role: string, id = "test-id") => {
  return jwt.sign({ id, email: "test@test.com", role }, config.jwt_access_Secret, { expiresIn: "1h" });
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

const patientData = {
  id: "patient-id-1",
  name: "John Doe",
  email: "john@test.com",
  gender: "male",
  dateOfBirth: new Date("1990-01-01"),
  phone: "+1234567890",
};

const otherPatientData = {
  id: "patient-id-2",
  name: "Jane Doe",
  email: "jane@test.com",
  gender: "female",
  dateOfBirth: new Date("1992-05-15"),
  phone: "+9876543210",
};

const appointmentData = {
  id: "appointment-id-1",
  patientId: "patient-id-1",
  doctorId: "doctor-id-1",
  scheduledAt: new Date("2025-06-20T10:00:00.000Z"),
  status: "BOOKED",
  doctor: { id: "doctor-id-1", name: "Dr. Smith", specialty: "Cardiology" },
};

const updatedPatientData = {
  ...patientData,
  phone: "+9998887777",
  name: "John Updated",
};

describe("Patient Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/patients/me", () => {
    it("should return the patient profile when found", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/patients/me")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ name: "John Doe" });
    });

    it("should return 404 when patient not found", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      const token = createToken("PATIENT", "nonexistent");
      const res = await request(app)
        .get("/api/patients/me")
        .set(authHeader(token));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });
  });

  describe("PUT /api/patients/me", () => {
    it("should update the patient profile", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      mockPrisma.patient.update.mockResolvedValue(updatedPatientData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .put("/api/patients/me")
        .set(authHeader(token))
        .send({ phone: "+9998887777", name: "John Updated" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe("+9998887777");
    });
  });

  describe("GET /api/patients/me/appointments", () => {
    it("should list the patient's appointments", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([appointmentData]);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/patients/me/appointments")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /api/patients/me/appointments", () => {
    it("should book an appointment successfully", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue(appointmentData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .post("/api/patients/me/appointments")
        .set(authHeader(token))
        .send({ doctorId: "doctor-id-1", scheduledAt: "2025-06-20T10:00:00.000Z" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should return conflict when time slot is already booked", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(appointmentData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .post("/api/patients/me/appointments")
        .set(authHeader(token))
        .send({ doctorId: "doctor-id-1", scheduledAt: "2025-06-20T10:00:00.000Z" });
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already booked");
    });
  });

  describe("PUT /api/patients/me/appointments/:id", () => {
    it("should reschedule an appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(appointmentData);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.update.mockResolvedValue({
        ...appointmentData,
        scheduledAt: new Date("2025-06-21T10:00:00.000Z"),
      });
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .put("/api/patients/me/appointments/appointment-id-1")
        .set(authHeader(token))
        .send({ scheduledAt: "2025-06-21T10:00:00.000Z" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when appointment not found", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .put("/api/patients/me/appointments/invalid-id")
        .set(authHeader(token))
        .send({ scheduledAt: "2025-06-21T10:00:00.000Z" });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return conflict when new time slot is already booked", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(appointmentData);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointmentData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .put("/api/patients/me/appointments/appointment-id-1")
        .set(authHeader(token))
        .send({ scheduledAt: "2025-06-20T10:00:00.000Z" });
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already booked");
    });
  });

  describe("DELETE /api/patients/me/appointments/:id", () => {
    it("should cancel an appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(appointmentData);
      mockPrisma.appointment.update.mockResolvedValue({
        ...appointmentData,
        status: "CANCELLED",
      });
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .delete("/api/patients/me/appointments/appointment-id-1")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return error when appointment is already completed", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...appointmentData,
        status: "COMPLETED",
      });
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .delete("/api/patients/me/appointments/appointment-id-1")
        .set(authHeader(token));
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot cancel");
    });
  });

  describe("GET /api/patients/search", () => {
    it("should search patients by name", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([{ patientId: "patient-id-1" }]);
      mockPrisma.patient.findMany.mockResolvedValue([patientData]);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/patients/search")
        .query({ name: "John" })
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/patients", () => {
    it("should list all patients with pagination", async () => {
      mockPrisma.patient.findMany.mockResolvedValue([patientData, otherPatientData]);
      mockPrisma.patient.count.mockResolvedValue(2);
      const token = createToken("RECEPTIONIST", "receptionist-id-1");
      const res = await request(app)
        .get("/api/patients")
        .query({ page: "1", limit: "10" })
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 2 });
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/patients/:id", () => {
    it("should return own profile when PATIENT requests own id", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/patients/patient-id-1")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("patient-id-1");
    });

    it("should return patient when DOCTOR is assigned to them", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      mockPrisma.appointment.findFirst.mockResolvedValue(appointmentData);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/patients/patient-id-1")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("John Doe");
    });

    it("should return error when DOCTOR is not assigned to the patient", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/patients/patient-id-1")
        .set(authHeader(token));
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("assigned patients");
    });
  });

  describe("PATCH /api/patients/:id", () => {
    it("should allow PATIENT to update their own limited fields", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      mockPrisma.patient.update.mockResolvedValue(updatedPatientData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .patch("/api/patients/patient-id-1")
        .set(authHeader(token))
        .send({ phone: "+9998887777" });
      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe("+9998887777");
    });

    it("should allow ADMIN to update all fields", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(patientData);
      mockPrisma.patient.update.mockResolvedValue({
        ...patientData,
        name: "Admin Updated",
        phone: "+1112223333",
      });
      const token = createToken("ADMIN", "admin-id-1");
      const res = await request(app)
        .patch("/api/patients/patient-id-1")
        .set(authHeader(token))
        .send({ name: "Admin Updated", phone: "+1112223333", gender: "female" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Admin Updated");
    });
  });
});
