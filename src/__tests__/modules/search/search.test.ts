import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const { createDoctorToken } = await import("../../helpers");

describe("Search Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/search/patients", () => {
    it("should find patients by name, condition, or medication", async () => {
      const patientByName = { id: "p1", name: "John Doe", email: "john@test.com", gender: "MALE", phone: "123" };
      const patientByCondition = { id: "p2", name: "Jane Doe", email: "jane@test.com", gender: "FEMALE", phone: "456" };

      mockPrisma.patient.findMany
        .mockResolvedValueOnce([patientByName])
        .mockResolvedValueOnce([patientByCondition])
        .mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/api/search/patients?query=doe")
        .set("Authorization", `Bearer ${createDoctorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data).toEqual(expect.arrayContaining([patientByName, patientByCondition]));
    });

    it("should return empty array when query is empty", async () => {
      const res = await request(app)
        .get("/api/search/patients?query=")
        .set("Authorization", `Bearer ${createDoctorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("GET /api/search/appointments", () => {
    it("should filter appointments by date, doctorId, and status", async () => {
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

      const res = await request(app)
        .get("/api/search/appointments?date=2025-06-15&doctorId=d1&status=BOOKED")
        .set("Authorization", `Bearer ${createDoctorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(appointments);
    });

    it("should return results with all params provided", async () => {
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

      const res = await request(app)
        .get("/api/search/appointments?date=2025-06-15&doctorId=d1&status=BOOKED")
        .set("Authorization", `Bearer ${createDoctorToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            doctorId: "d1",
            status: "BOOKED",
            scheduledAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          }),
        }),
      );
    });
  });
});
