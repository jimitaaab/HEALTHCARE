import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const createToken = async (role: string, id = "test-id", email = "test@test.com") => {
  const { default: jwt } = await import("jsonwebtoken");
  const { default: config } = await import("../../../config/env");
  return jwt.sign({ id, email, role }, config.jwt_access_Secret, { expiresIn: "1h" });
};

const baseAppointment = {
  id: "appointment-id-1",
  patientId: "patient-id-1",
  doctorId: "doctor-id-1",
  scheduledAt: new Date("2025-06-15T10:00:00.000Z"),
  status: "BOOKED",
  patient: { id: "patient-id-1", name: "Patient One" },
  doctor: { id: "doctor-id-1", name: "Doctor One", specialty: "Cardiology" },
};

describe("Appointment Module", () => {
  let request: any;
  let app: any;
  let patientToken: string;
  let doctorToken: string;
  let receptionistToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const mod = await import("supertest");
    request = mod.default;
    const appMod = await import("../../../app");
    app = appMod.default;
    patientToken = await createToken("PATIENT", "patient-id-1", "patient@test.com");
    doctorToken = await createToken("DOCTOR", "doctor-id-1", "doctor@test.com");
    receptionistToken = await createToken("RECEPTIONIST", "receptionist-id-1", "receptionist@test.com");
    adminToken = await createToken("ADMIN", "admin-id-1", "admin@test.com");
  });

  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/appointments", () => {
    it("should retrieve appointments for a doctor (auto-scoped)", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("appointment-id-1");
      expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 1 });
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: "doctor-id-1" }),
        }),
      );
    });

    it("should retrieve appointments for admin with date filter", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([baseAppointment]);
      mockPrisma.appointment.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/appointments?date=2025-06-15&status=BOOKED")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should retrieve appointments with pagination", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.appointment.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/appointments?page=2&limit=5")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it("should return 403 for PATIENT role", async () => {
      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/appointments", () => {
    it("should create an appointment successfully", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.create.mockResolvedValue(baseAppointment);

      const res = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          patientId: "patient-id-1",
          doctorId: "doctor-id-1",
          scheduledAt: "2025-06-15T10:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Appointment booked successfully");
    });

    it("should return conflict when time slot is already booked", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(baseAppointment);

      const res = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          patientId: "patient-id-1",
          doctorId: "doctor-id-1",
          scheduledAt: "2025-06-15T10:00:00.000Z",
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Time slot already booked/i);
    });
  });

  describe("PATCH /api/appointments/:id", () => {
    it("should update/reschedule an appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(baseAppointment);
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      mockPrisma.appointment.update.mockResolvedValue({
        ...baseAppointment,
        scheduledAt: new Date("2025-06-16T10:00:00.000Z"),
      });

      const res = await request(app)
        .patch("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when appointment not found", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/appointments/non-existent")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when patient tries to update another patient's appointment", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        patientId: "other-patient-id",
      });

      const res = await request(app)
        .patch("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/You can only update your own appointments/i);
    });

    it("should return error when rescheduling a completed appointment", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        status: "COMPLETED",
      });

      const res = await request(app)
        .patch("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Cannot reschedule a completed appointment/i);
    });

    it("should return conflict when new time slot is already booked", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(baseAppointment);
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: "other-appointment" });

      const res = await request(app)
        .patch("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/New time slot already booked/i);
    });
  });

  describe("POST /api/appointments/override", () => {
    it("should create an override appointment successfully", async () => {
      mockPrisma.appointment.create.mockResolvedValue(baseAppointment);

      const res = await request(app)
        .post("/api/appointments/override")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patientId: "patient-id-1",
          doctorId: "doctor-id-1",
          scheduledAt: "2025-06-15T10:00:00.000Z",
          reason: "Emergency override",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Appointment overridden successfully");
    });

    it("should return 400 when reason is missing", async () => {
      const res = await request(app)
        .post("/api/appointments/override")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patientId: "patient-id-1",
          doctorId: "doctor-id-1",
          scheduledAt: "2025-06-15T10:00:00.000Z",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Override reason is required/i);
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    it("should cancel an appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(baseAppointment);
      mockPrisma.appointment.update.mockResolvedValue({
        ...baseAppointment,
        status: "CANCELLED",
      });

      const res = await request(app)
        .delete("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Appointment cancelled successfully");
    });

    it("should return 404 when appointment not found", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/appointments/non-existent")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 when patient tries to cancel another patient's appointment", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        patientId: "other-patient-id",
      });

      const res = await request(app)
        .delete("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/You can only cancel your own appointments/i);
    });

    it("should return error when cancelling a completed appointment", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        status: "COMPLETED",
      });

      const res = await request(app)
        .delete("/api/appointments/appointment-id-1")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Cannot cancel a completed or already cancelled appointment/i);
    });
  });

  describe("POST /api/appointments/:id/check-in", () => {
    it("should check in a patient successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(baseAppointment);
      mockPrisma.appointment.update.mockResolvedValue({
        ...baseAppointment,
        status: "CHECKED_IN",
      });

      const res = await request(app)
        .post("/api/appointments/appointment-id-1/check-in")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Patient checked in successfully");
    });

    it("should return error when appointment is not booked", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        status: "CHECKED_IN",
      });

      const res = await request(app)
        .post("/api/appointments/appointment-id-1/check-in")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Only booked appointments can be checked in/i);
    });
  });

  describe("POST /api/appointments/:id/check-out", () => {
    it("should check out a patient successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        status: "CHECKED_IN",
      });
      mockPrisma.appointment.update.mockResolvedValue({
        ...baseAppointment,
        status: "COMPLETED",
      });

      const res = await request(app)
        .post("/api/appointments/appointment-id-1/check-out")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Patient checked out successfully");
    });

    it("should return error when appointment is not checked in", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...baseAppointment,
        status: "BOOKED",
      });

      const res = await request(app)
        .post("/api/appointments/appointment-id-1/check-out")
        .set("Authorization", `Bearer ${receptionistToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Only checked-in appointments can be checked out/i);
    });
  });
});
