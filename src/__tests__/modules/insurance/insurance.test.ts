import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const { createReceptionistToken, createPatientToken } = await import("../../helpers");

describe("Insurance Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/insurance", () => {
    it("should return all claims for receptionist", async () => {
      const mockClaims = [
        {
          id: "claim-1",
          status: "SUBMITTED",
          patientId: "patient-1",
          appointmentId: "appointment-1",
          patient: { id: "patient-1", name: "John Doe" },
          appointment: { id: "appointment-1", scheduledAt: "2025-06-15T10:00:00.000Z" },
        },
      ];
      mockPrisma.insuranceClaim.findMany.mockResolvedValue(mockClaims);

      const res = await request(app)
        .get("/api/insurance")
        .set("Authorization", `Bearer ${createReceptionistToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockClaims);
      expect(mockPrisma.insuranceClaim.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, name: true } },
          appointment: { select: { id: true, scheduledAt: true } },
        },
      });
    });
  });

  describe("POST /api/insurance", () => {
    it("should create a claim successfully", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "appointment-1" });
      mockPrisma.insuranceClaim.findUnique.mockResolvedValue(null);

      const newClaim = {
        id: "claim-1",
        patientId: "patient-1",
        appointmentId: "appointment-1",
        status: "SUBMITTED",
        patient: { id: "patient-1", name: "John Doe" },
        appointment: { id: "appointment-1", scheduledAt: "2025-06-15T10:00:00.000Z" },
      };
      mockPrisma.insuranceClaim.create.mockResolvedValue(newClaim);

      const res = await request(app)
        .post("/api/insurance")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ patientId: "patient-1", appointmentId: "appointment-1" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Insurance claim submitted successfully");
      expect(res.body.data).toEqual(newClaim);
    });

    it("should return 404 when appointment not found", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/insurance")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ patientId: "patient-1", appointmentId: "nonexistent" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Appointment not found");
    });

    it("should return 409 when duplicate claim exists", async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({ id: "appointment-1" });
      mockPrisma.insuranceClaim.findUnique.mockResolvedValue({ id: "existing-claim", status: "SUBMITTED" });

      const res = await request(app)
        .post("/api/insurance")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ patientId: "patient-1", appointmentId: "appointment-1" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("A claim for this appointment already exists");
    });
  });

  describe("PUT /api/insurance/:id", () => {
    it("should update claim status successfully", async () => {
      mockPrisma.insuranceClaim.findUnique.mockResolvedValue({ id: "claim-1", status: "SUBMITTED" });

      const updated = {
        id: "claim-1",
        status: "APPROVED",
        patient: { id: "patient-1", name: "John Doe" },
        appointment: { id: "appointment-1", scheduledAt: "2025-06-15T10:00:00.000Z" },
      };
      mockPrisma.insuranceClaim.update.mockResolvedValue(updated);

      const res = await request(app)
        .put("/api/insurance/claim-1")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Claim status updated successfully");
      expect(res.body.data).toEqual(updated);
      expect(mockPrisma.insuranceClaim.update).toHaveBeenCalledWith({
        where: { id: "claim-1" },
        data: { status: "APPROVED" },
        include: {
          patient: { select: { id: true, name: true } },
          appointment: { select: { id: true, scheduledAt: true } },
        },
      });
    });

    it("should return 404 when claim not found", async () => {
      mockPrisma.insuranceClaim.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/insurance/nonexistent")
        .set("Authorization", `Bearer ${createReceptionistToken()}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Claim not found");
    });
  });

  describe("GET /api/insurance/me", () => {
    it("should return patient's own claims", async () => {
      const mockClaims = [
        {
          id: "claim-1",
          status: "SUBMITTED",
          appointment: { id: "appointment-1", scheduledAt: "2025-06-15T10:00:00.000Z" },
        },
      ];
      mockPrisma.insuranceClaim.findMany.mockResolvedValue(mockClaims);

      const res = await request(app)
        .get("/api/insurance/me")
        .set("Authorization", `Bearer ${createPatientToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockClaims);
      expect(mockPrisma.insuranceClaim.findMany).toHaveBeenCalledWith({
        where: { patientId: "patient-id-1" },
        orderBy: { createdAt: "desc" },
        include: {
          appointment: { select: { id: true, scheduledAt: true } },
        },
      });
    });
  });
});
