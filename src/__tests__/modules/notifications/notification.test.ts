import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const {
  createPatientToken,
  createDoctorToken,
  createReceptionistToken,
  createAdminToken,
} = await import("../../helpers");

describe("Notification Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/notifications/me", () => {
    it("should return upcoming appointments for PATIENT in next 48h", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: "apt-1",
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          doctor: { name: "Dr. Smith", specialty: "Cardiology" },
        },
      ]);

      const res = await request(app)
        .get("/api/notifications/me")
        .set("Authorization", `Bearer ${createPatientToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("APPOINTMENT_REMINDER");
      expect(res.body.data[0].message).toContain("Dr. Smith");
    });

    it("should return upcoming appointments for DOCTOR in next 24h", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: "apt-1",
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          patient: { name: "John Doe" },
        },
      ]);

      const res = await request(app)
        .get("/api/notifications/me")
        .set("Authorization", `Bearer ${createDoctorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("APPOINTMENT_REMINDER");
      expect(res.body.data[0].message).toContain("John Doe");
    });

    it("should return today's schedule for RECEPTIONIST", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: "apt-1",
          scheduledAt: new Date(),
          patient: { name: "John Doe" },
          doctor: { name: "Dr. Smith", specialty: "Cardiology" },
        },
      ]);

      const res = await request(app)
        .get("/api/notifications/me")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].type).toBe("DAILY_SCHEDULE");
      expect(res.body.data[0].message).toContain("1 appointment(s)");
      expect(res.body.data[1].type).toBe("APPOINTMENT_REMINDER");
      expect(res.body.data[1].message).toContain("John Doe");
    });
  });

  describe("POST /api/notifications/trigger", () => {
    it("should trigger reminder run for admin", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: "apt-1",
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: "BOOKED",
          patient: { id: "p1", name: "John Doe", email: "john@test.com" },
          doctor: { id: "d1", name: "Dr. Smith" },
        },
      ]);

      const res = await request(app)
        .post("/api/notifications/trigger")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Reminder run triggered successfully");
      expect(res.body.data.remindersGenerated).toBe(1);
      expect(res.body.data.details[0].patientName).toBe("John Doe");
    });

    it("should return 403 for non-admin", async () => {
      const res = await request(app)
        .post("/api/notifications/trigger")
        .set("Authorization", `Bearer ${createPatientToken()}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("do not have permission");
    });
  });
});
