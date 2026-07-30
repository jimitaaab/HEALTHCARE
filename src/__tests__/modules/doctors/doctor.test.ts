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

const doctorData = {
  id: "doctor-id-1",
  name: "Dr. Smith",
  email: "smith@clinic.com",
  gender: "male",
  specialty: "Cardiology",
  createdAt: new Date("2024-01-01"),
};

const doctorData2 = {
  id: "doctor-id-2",
  name: "Dr. Jones",
  email: "jones@clinic.com",
  gender: "female",
  specialty: "Neurology",
  createdAt: new Date("2024-02-01"),
};

const updatedDoctorData = {
  ...doctorData,
  name: "Dr. Smith Updated",
  specialty: "Cardiology & Internal Medicine",
};

const appointmentData = {
  id: "appointment-id-1",
  doctorId: "doctor-id-1",
  patientId: "patient-id-1",
  scheduledAt: new Date("2025-06-20T10:00:00.000Z"),
  status: "BOOKED",
  patient: { id: "patient-id-1", name: "John Doe" },
};

const scheduleResult = {
  weekStart: new Date("2025-06-15T00:00:00.000Z"),
  weekEnd: new Date("2025-06-21T23:59:59.999Z"),
  appointments: [appointmentData],
};

describe("Doctor Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/doctors", () => {
    it("should list all doctors with search, specialty filters and pagination", async () => {
      mockPrisma.doctor.findMany.mockResolvedValue([doctorData, doctorData2]);
      mockPrisma.doctor.count.mockResolvedValue(2);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/doctors")
        .query({ search: "Dr.", specialty: "Cardiology", page: "1", limit: "10" })
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 2 });
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/doctors/me", () => {
    it("should return the doctor profile", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(doctorData);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/doctors/me")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ name: "Dr. Smith" });
    });
  });

  describe("PUT /api/doctors/me", () => {
    it("should update the doctor profile", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(doctorData);
      mockPrisma.doctor.update.mockResolvedValue(updatedDoctorData);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .put("/api/doctors/me")
        .set(authHeader(token))
        .send({ name: "Dr. Smith Updated", specialty: "Cardiology & Internal Medicine" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Dr. Smith Updated");
    });
  });

  describe("GET /api/doctors/me/schedule", () => {
    it("should return schedule without date query (defaults to current week)", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([appointmentData]);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/doctors/me/schedule")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("weekStart");
      expect(res.body.data).toHaveProperty("weekEnd");
      expect(res.body.data).toHaveProperty("appointments");
    });

    it("should return schedule with a specific date query", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([appointmentData]);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/doctors/me/schedule")
        .query({ date: "2025-06-15" })
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.appointments).toHaveLength(1);
    });
  });

  describe("GET /api/doctors/me/appointments", () => {
    it("should list upcoming appointments for the doctor", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([appointmentData]);
      const token = createToken("DOCTOR", "doctor-id-1");
      const res = await request(app)
        .get("/api/doctors/me/appointments")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/doctors/:id", () => {
    it("should return doctor by ID when found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(doctorData);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/doctors/doctor-id-1")
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Dr. Smith");
    });

    it("should return 404 when doctor not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      const token = createToken("PATIENT", "patient-id-1");
      const res = await request(app)
        .get("/api/doctors/nonexistent-id")
        .set(authHeader(token));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });
  });
});
