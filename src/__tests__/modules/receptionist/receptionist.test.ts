import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const { createReceptionistToken } = await import("../../helpers");

describe("Receptionist Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/receptionist/appointments", () => {
    it("should return paginated appointments with filters", async () => {
      const appointments = [
        {
          id: "apt-1",
          scheduledAt: "2025-06-15T10:00:00.000Z",
          status: "BOOKED",
          patient: { id: "p1", name: "John", phone: "123" },
          doctor: { id: "d1", name: "Dr. Smith", specialty: "Cardiology" },
        },
      ];
      mockPrisma.appointment.findMany.mockResolvedValue(appointments);
      mockPrisma.appointment.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/receptionist/appointments?date=2025-06-15&doctorId=d1&status=BOOKED&page=1&limit=50")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(appointments);
      expect(res.body.meta).toEqual({ page: 1, limit: 50, total: 1 });
    });

    it("should use default limit of 50 when not provided", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.appointment.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/receptionist/appointments")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(50);
    });
  });

  describe("PUT /api/receptionist/appointments/:id", () => {
    it("should update appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "apt-1", status: "BOOKED" });

      const updated = {
        id: "apt-1",
        scheduledAt: "2025-06-16T10:00:00.000Z",
        status: "BOOKED",
        patient: { id: "p1", name: "John", phone: "123" },
        doctor: { id: "d1", name: "Dr. Smith", specialty: "Cardiology" },
      };
      mockPrisma.appointment.update.mockResolvedValue(updated);

      const res = await request(app)
        .put("/api/receptionist/appointments/apt-1")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z", status: "BOOKED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Appointment updated successfully");
      expect(res.body.data).toEqual(updated);
    });

    it("should return 404 when appointment not found", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/receptionist/appointments/nonexistent")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ scheduledAt: "2025-06-16T10:00:00.000Z" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Appointment not found");
    });
  });

  describe("PUT /api/receptionist/appointments/:id/check-in", () => {
    it("should check in a booked appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "apt-1", status: "BOOKED" });

      const checkedIn = {
        id: "apt-1",
        status: "CHECKED_IN",
        patient: { id: "p1", name: "John" },
        doctor: { id: "d1", name: "Dr. Smith" },
      };
      mockPrisma.appointment.update.mockResolvedValue(checkedIn);

      const res = await request(app)
        .put("/api/receptionist/appointments/apt-1/check-in")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Patient checked in successfully");
      expect(res.body.data).toEqual(checkedIn);
    });

    it("should return error when appointment is not booked", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "apt-1", status: "CHECKED_IN" });

      const res = await request(app)
        .put("/api/receptionist/appointments/apt-1/check-in")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Only booked appointments can be checked in");
    });
  });

  describe("PUT /api/receptionist/appointments/:id/check-out", () => {
    it("should check out a checked-in appointment successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "apt-1", status: "CHECKED_IN" });

      const completed = {
        id: "apt-1",
        status: "COMPLETED",
        patient: { id: "p1", name: "John" },
        doctor: { id: "d1", name: "Dr. Smith" },
      };
      mockPrisma.appointment.update.mockResolvedValue(completed);

      const res = await request(app)
        .put("/api/receptionist/appointments/apt-1/check-out")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Patient checked out successfully");
      expect(res.body.data).toEqual(completed);
    });

    it("should return error when appointment is not checked in", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "apt-1", status: "BOOKED" });

      const res = await request(app)
        .put("/api/receptionist/appointments/apt-1/check-out")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Only checked-in appointments can be checked out");
    });
  });
});
