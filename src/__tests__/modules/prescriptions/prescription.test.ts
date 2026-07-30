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

const mockPrescription = {
  id: "prescription-id-1",
  patientId: "patient-id-1",
  doctorId: "doctor-id-1",
  diagnosisId: "diagnosis-id-1",
  drug: "Amlodipine",
  dosage: "5mg",
  frequency: "Once daily",
  duration: "30 days",
  createdAt: new Date("2025-06-15T12:00:00.000Z"),
  patient: { id: "patient-id-1", name: "Patient One" },
  doctor: { id: "doctor-id-1", name: "Doctor One" },
  diagnosis: { condition: "Hypertension" },
};

describe("Prescription Module", () => {
  let request: any;
  let app: any;
  let patientToken: string;
  let doctorToken: string;

  beforeAll(async () => {
    const mod = await import("supertest");
    request = mod.default;
    const appMod = await import("../../../app");
    app = appMod.default;
    patientToken = await createToken("PATIENT", "patient-id-1", "patient@test.com");
    doctorToken = await createToken("DOCTOR", "doctor-id-1", "doctor@test.com");
  });

  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/prescriptions/me", () => {
    it("should retrieve own prescriptions for patient", async () => {
      mockPrisma.prescription.findMany.mockResolvedValue([mockPrescription]);

      const res = await request(app)
        .get("/api/prescriptions/me")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].drug).toBe("Amlodipine");
    });
  });

  describe("POST /api/prescriptions", () => {
    it("should create a prescription successfully", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "doctor-id-1",
        name: "Doctor One",
      });
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: "patient-id-1",
        name: "Patient One",
      });
      mockPrisma.diagnosis.findUnique.mockResolvedValue({
        id: "diagnosis-id-1",
        condition: "Hypertension",
      });
      mockPrisma.prescription.create.mockResolvedValue(mockPrescription);

      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: "patient-id-1",
          diagnosisId: "diagnosis-id-1",
          drug: "Amlodipine",
          dosage: "5mg",
          frequency: "Once daily",
          duration: "30 days",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Prescription created successfully");
    });

    it("should return 404 when doctor profile is not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: "patient-id-1",
          drug: "Amlodipine",
          dosage: "5mg",
          frequency: "Once daily",
          duration: "30 days",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Doctor profile not found/i);
    });

    it("should return 404 when patient is not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "doctor-id-1",
        name: "Doctor One",
      });
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: "non-existent-patient",
          drug: "Amlodipine",
          dosage: "5mg",
          frequency: "Once daily",
          duration: "30 days",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Patient not found/i);
    });

    it("should return 404 when diagnosis is not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "doctor-id-1",
        name: "Doctor One",
      });
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: "patient-id-1",
        name: "Patient One",
      });
      mockPrisma.diagnosis.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: "patient-id-1",
          diagnosisId: "non-existent-diagnosis",
          drug: "Amlodipine",
          dosage: "5mg",
          frequency: "Once daily",
          duration: "30 days",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Diagnosis not found/i);
    });
  });

  describe("POST /api/prescriptions/me/:id/refill", () => {
    it("should request a refill successfully", async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);

      const res = await request(app)
        .post("/api/prescriptions/me/prescription-id-1/refill")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Refill requested successfully");
    });

    it("should return 404 when prescription is not found", async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/prescriptions/me/non-existent/refill")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Prescription not found/i);
    });

    it("should return error when requesting refill for another patient's prescription", async () => {
      mockPrisma.prescription.findUnique.mockResolvedValue({
        ...mockPrescription,
        patientId: "other-patient-id",
      });

      const res = await request(app)
        .post("/api/prescriptions/me/prescription-id-1/refill")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/You can only request refills for your own prescriptions/i);
    });
  });
});
