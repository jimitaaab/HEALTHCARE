import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";

const mockBcryptHash = jest.fn().mockResolvedValue("hashed-password");

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: { hash: mockBcryptHash },
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const { createAdminToken } = await import("../../helpers");

describe("Admin Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/admin/users", () => {
    it("should list all users with role and search filters", async () => {
      mockPrisma.patient.findMany.mockResolvedValue([
        { id: "p1", name: "John", email: "john@test.com", gender: "MALE", createdAt: new Date() },
      ]);
      mockPrisma.doctor.findMany.mockResolvedValue([]);
      mockPrisma.receptionist.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/admin/users?role=PATIENT&search=John")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].role).toBe("PATIENT");
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe("POST /api/admin/users/:role", () => {
    it("should create a PATIENT user successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValueOnce(null);
      mockPrisma.doctor.findUnique.mockResolvedValueOnce(null);
      mockPrisma.receptionist.findUnique.mockResolvedValueOnce(null);
      mockPrisma.patient.create.mockResolvedValue({ id: "new-p1", email: "patient@test.com" });

      const res = await request(app)
        .post("/api/admin/users/PATIENT")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "Jane", email: "patient@test.com", password: "pass123" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("new-p1");
    });

    it("should create a DOCTOR user successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValueOnce(null);
      mockPrisma.doctor.findUnique.mockResolvedValueOnce(null);
      mockPrisma.receptionist.findUnique.mockResolvedValueOnce(null);
      mockPrisma.doctor.create.mockResolvedValue({ id: "new-d1", email: "doc@test.com" });

      const res = await request(app)
        .post("/api/admin/users/DOCTOR")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "Dr. House", email: "doc@test.com", password: "pass123" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should create a RECEPTIONIST user successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValueOnce(null);
      mockPrisma.doctor.findUnique.mockResolvedValueOnce(null);
      mockPrisma.receptionist.findUnique.mockResolvedValueOnce(null);
      mockPrisma.receptionist.create.mockResolvedValue({ id: "new-r1", email: "recep@test.com" });

      const res = await request(app)
        .post("/api/admin/users/RECEPTIONIST")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "Claire", email: "recep@test.com", password: "pass123" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should return 409 for duplicate email", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: "existing", email: "dup@test.com" });

      const res = await request(app)
        .post("/api/admin/users/PATIENT")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "Dup", email: "dup@test.com", password: "pass123" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });
  });

  describe("PUT /api/admin/users/:role/:id", () => {
    it("should update a PATIENT user successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: "p1", name: "Old" });
      mockPrisma.patient.update.mockResolvedValue({ id: "p1", name: "New", email: "p@t.com" });

      const res = await request(app)
        .put("/api/admin/users/PATIENT/p1")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when PATIENT not found", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/admin/users/PATIENT/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Patient not found");
    });

    it("should update a DOCTOR user successfully", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({ id: "d1", name: "Old" });
      mockPrisma.doctor.update.mockResolvedValue({ id: "d1", name: "New", email: "d@t.com" });

      const res = await request(app)
        .put("/api/admin/users/DOCTOR/d1")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when DOCTOR not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/admin/users/DOCTOR/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Doctor not found");
    });

    it("should update a RECEPTIONIST user successfully", async () => {
      mockPrisma.receptionist.findUnique.mockResolvedValue({ id: "r1", name: "Old" });
      mockPrisma.receptionist.update.mockResolvedValue({ id: "r1", name: "New", email: "r@t.com" });

      const res = await request(app)
        .put("/api/admin/users/RECEPTIONIST/r1")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 when RECEPTIONIST not found", async () => {
      mockPrisma.receptionist.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/admin/users/RECEPTIONIST/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "New" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Receptionist not found");
    });
  });

  describe("DELETE /api/admin/users/:role/:id", () => {
    it("should delete a PATIENT user successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: "p1" });
      mockPrisma.patient.delete.mockResolvedValue({ id: "p1" });

      const res = await request(app)
        .delete("/api/admin/users/PATIENT/p1")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User deleted successfully");
    });

    it("should return 404 when PATIENT not found", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/admin/users/PATIENT/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Patient not found");
    });

    it("should delete a DOCTOR user successfully", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({ id: "d1" });
      mockPrisma.doctor.delete.mockResolvedValue({ id: "d1" });

      const res = await request(app)
        .delete("/api/admin/users/DOCTOR/d1")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
    });

    it("should return 404 when DOCTOR not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/admin/users/DOCTOR/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Doctor not found");
    });

    it("should delete a RECEPTIONIST user successfully", async () => {
      mockPrisma.receptionist.findUnique.mockResolvedValue({ id: "r1" });
      mockPrisma.receptionist.delete.mockResolvedValue({ id: "r1" });

      const res = await request(app)
        .delete("/api/admin/users/RECEPTIONIST/r1")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
    });

    it("should return 404 when RECEPTIONIST not found", async () => {
      mockPrisma.receptionist.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/admin/users/RECEPTIONIST/nonexistent")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Receptionist not found");
    });
  });

  describe("GET /api/admin/analytics/demographics", () => {
    it("should return gender breakdown", async () => {
      mockPrisma.patient.findMany.mockResolvedValue([
        { gender: "MALE" },
        { gender: "FEMALE" },
        { gender: "MALE" },
      ]);

      const res = await request(app)
        .get("/api/admin/analytics/demographics")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.breakdown).toEqual({ MALE: 2, FEMALE: 1 });
    });
  });

  describe("GET /api/admin/analytics/diagnoses", () => {
    it("should return top 10 diagnoses", async () => {
      mockPrisma.diagnosis.groupBy.mockResolvedValue([
        { condition: "Hypertension", _count: { condition: 5 } },
        { condition: "Diabetes", _count: { condition: 3 } },
      ]);

      const res = await request(app)
        .get("/api/admin/analytics/diagnoses")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([
        { condition: "Hypertension", count: 5 },
        { condition: "Diabetes", count: 3 },
      ]);
    });
  });

  describe("GET /api/admin/analytics/appointments", () => {
    it("should return monthly volume trends", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([
        { scheduledAt: new Date("2025-06-15"), status: "COMPLETED", createdAt: new Date("2025-06-10") },
        { scheduledAt: new Date("2025-06-16"), status: "CANCELLED", createdAt: new Date("2025-06-11") },
        { scheduledAt: new Date("2025-07-01"), status: "BOOKED", createdAt: new Date("2025-07-20") },
      ]);

      const res = await request(app)
        .get("/api/admin/analytics/appointments")
        .set("Authorization", `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.volume).toHaveLength(2);
      expect(res.body.data.volume[0].month).toBe("2025-06");
      expect(res.body.data.volume[0].total).toBe(2);
      expect(res.body.data.volume[0].completed).toBe(1);
      expect(res.body.data.volume[0].cancelled).toBe(1);
      expect(res.body.data.volume[1].month).toBe("2025-07");
      expect(res.body.data.volume[1].total).toBe(1);
    });
  });
});
