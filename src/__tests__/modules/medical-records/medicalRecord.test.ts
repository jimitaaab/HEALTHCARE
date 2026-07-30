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

const mockHistory = {
  appointments: [
    {
      id: "appointment-id-1",
      patientId: "patient-id-1",
      doctorId: "doctor-id-1",
      scheduledAt: new Date("2025-06-15T10:00:00.000Z"),
      status: "COMPLETED",
      doctor: { id: "doctor-id-1", name: "Doctor One", specialty: "Cardiology" },
    },
  ],
  medicalRecords: [
    {
      id: "record-id-1",
      patientId: "patient-id-1",
      doctorId: "doctor-id-1",
      notes: "Patient is doing well",
      createdAt: new Date("2025-06-15T12:00:00.000Z"),
      doctor: { id: "doctor-id-1", name: "Doctor One" },
      diagnoses: [{ id: "diagnosis-id-1", condition: "Hypertension", notes: "Stage 1" }],
    },
  ],
  prescriptions: [
    {
      id: "prescription-id-1",
      patientId: "patient-id-1",
      doctorId: "doctor-id-1",
      drug: "Amlodipine",
      dosage: "5mg",
      frequency: "Once daily",
      duration: "30 days",
      createdAt: new Date("2025-06-15T12:00:00.000Z"),
      doctor: { id: "doctor-id-1", name: "Doctor One" },
      diagnosis: { condition: "Hypertension" },
    },
  ],
};

const mockRecord = {
  id: "record-id-1",
  patientId: "patient-id-1",
  doctorId: "doctor-id-1",
  notes: "Patient is doing well",
  createdAt: new Date("2025-06-15T12:00:00.000Z"),
};

const mockDiagnosis = {
  id: "diagnosis-id-1",
  recordId: "record-id-1",
  condition: "Hypertension",
  notes: "Stage 1",
};

describe("Medical Record Module", () => {
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

  describe("GET /api/medical-records/me", () => {
    it("should retrieve own medical history for patient", async () => {
      mockPrisma.appointment.findMany.mockResolvedValue(mockHistory.appointments);
      mockPrisma.medicalRecord.findMany.mockResolvedValue(mockHistory.medicalRecords);
      mockPrisma.prescription.findMany.mockResolvedValue(mockHistory.prescriptions);

      const res = await request(app)
        .get("/api/medical-records/me")
        .set("Authorization", `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointments).toHaveLength(1);
      expect(res.body.data.medicalRecords).toHaveLength(1);
      expect(res.body.data.prescriptions).toHaveLength(1);
    });
  });

  describe("GET /api/medical-records/patient/:patientId", () => {
    it("should retrieve patient history for assigned doctor", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(mockHistory.appointments[0]);
      mockPrisma.appointment.findMany.mockResolvedValue(mockHistory.appointments);
      mockPrisma.medicalRecord.findMany.mockResolvedValue(mockHistory.medicalRecords);
      mockPrisma.prescription.findMany.mockResolvedValue(mockHistory.prescriptions);

      const res = await request(app)
        .get("/api/medical-records/patient/patient-id-1")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Patient history retrieved successfully");
    });

    it("should return forbidden when doctor has no appointment with patient", async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/medical-records/patient/patient-id-2")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/You can only view your assigned patients/i);
    });
  });

  describe("POST /api/medical-records/patient/:patientId", () => {
    it("should create a medical record successfully", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "doctor-id-1",
        name: "Doctor One",
      });
      mockPrisma.medicalRecord.create.mockResolvedValue(mockRecord);

      const res = await request(app)
        .post("/api/medical-records/patient/patient-id-1")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ notes: "Patient is doing well" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Medical record created successfully");
    });

    it("should return 404 when doctor profile is not found", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/medical-records/patient/patient-id-1")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ notes: "Patient is doing well" });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Doctor profile not found/i);
    });
  });

  describe("POST /api/medical-records/:recordId/diagnoses", () => {
    it("should add a diagnosis successfully", async () => {
      mockPrisma.medicalRecord.findUnique.mockResolvedValue(mockRecord);
      mockPrisma.diagnosis.create.mockResolvedValue(mockDiagnosis);

      const res = await request(app)
        .post("/api/medical-records/record-id-1/diagnoses")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ condition: "Hypertension", notes: "Stage 1" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Diagnosis added successfully");
    });

    it("should return 404 when medical record not found", async () => {
      mockPrisma.medicalRecord.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/medical-records/non-existent/diagnoses")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ condition: "Hypertension" });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Medical record not found/i);
    });

    it("should return error when doctor does not own the record", async () => {
      mockPrisma.medicalRecord.findUnique.mockResolvedValue({
        ...mockRecord,
        doctorId: "other-doctor-id",
      });

      const res = await request(app)
        .post("/api/medical-records/record-id-1/diagnoses")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ condition: "Hypertension" });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/You can only add diagnoses to your own records/i);
    });
  });
});
