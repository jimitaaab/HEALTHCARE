import { jest } from "@jest/globals";
import { mockPrisma } from "../../mocks/prisma";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app");
const bcrypt = await import("bcryptjs");

describe("Auth Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    const registerPayload = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      gender: "Male",
      dateOfBirth: "1990-01-01",
      phone: "1234567890",
    };

    it("should register a patient successfully", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      mockPrisma.receptionist.findUnique.mockResolvedValue(null);
      (bcrypt.default.hash as jest.Mock).mockResolvedValue("hashed_password");
      mockPrisma.patient.create.mockResolvedValue({
        id: "patient-id-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        gender: "Male",
        dateOfBirth: new Date("1990-01-01"),
        phone: "1234567890",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Account created successfully");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: "patient-id-1",
        email: "john@example.com",
        role: "PATIENT",
      });
      expect(mockPrisma.patient.create).toHaveBeenCalledTimes(1);
    });

    it("should return 409 when email already exists as patient", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: "existing-id",
        email: "john@example.com",
        password: "hash",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });

    it("should return 409 when email already exists as doctor", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "existing-doctor-id",
        email: "john@example.com",
        password: "hash",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should return 409 when email already exists as receptionist", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      mockPrisma.receptionist.findUnique.mockResolvedValue({
        id: "existing-receptionist-id",
        email: "john@example.com",
        password: "hash",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    const loginPayload = { email: "john@example.com", password: "password123" };

    it("should login successfully as patient", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: "patient-id-1",
        email: "john@example.com",
        password: "hashed_password",
        name: "John Doe",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: "patient-id-1",
        email: "john@example.com",
        role: "PATIENT",
      });
    });

    it("should login successfully as doctor", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue({
        id: "doctor-id-1",
        email: "john@example.com",
        password: "hashed_password",
        name: "Dr. John",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("DOCTOR");
    });

    it("should login successfully as receptionist", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      mockPrisma.receptionist.findUnique.mockResolvedValue({
        id: "receptionist-id-1",
        email: "john@example.com",
        password: "hashed_password",
        name: "Receptionist John",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("RECEPTIONIST");
    });

    it("should return error with invalid email", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.doctor.findUnique.mockResolvedValue(null);
      mockPrisma.receptionist.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginPayload);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should return error with wrong password", async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: "patient-id-1",
        email: "john@example.com",
        password: "hashed_password",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginPayload);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe("POST /api/auth/admin/signup", () => {
    const signupPayload = {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
    };

    it("should create admin successfully", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);
      (bcrypt.default.hash as jest.Mock).mockResolvedValue("hashed_admin_password");
      mockPrisma.admin.create.mockResolvedValue({
        id: "admin-id-1",
        name: "Admin User",
        email: "admin@example.com",
        password: "hashed_admin_password",
      });

      const res = await request(app)
        .post("/api/auth/admin/signup")
        .send(signupPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Admin account created successfully");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: "admin-id-1",
        email: "admin@example.com",
        role: "ADMIN",
      });
    });

    it("should return 409 when admin email already exists", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({
        id: "existing-admin-id",
        email: "admin@example.com",
      });

      const res = await request(app)
        .post("/api/auth/admin/signup")
        .send(signupPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/admin/login", () => {
    const loginPayload = { email: "admin@example.com", password: "admin123" };

    it("should login admin successfully", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({
        id: "admin-id-1",
        email: "admin@example.com",
        password: "hashed_admin_password",
        name: "Admin User",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/admin/login")
        .send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Admin login successful");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toEqual({
        id: "admin-id-1",
        email: "admin@example.com",
        role: "ADMIN",
      });
    });

    it("should return error with invalid admin email", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/admin/login")
        .send(loginPayload);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should return error with wrong admin password", async () => {
      mockPrisma.admin.findUnique.mockResolvedValue({
        id: "admin-id-1",
        email: "admin@example.com",
        password: "hashed_admin_password",
      });
      (bcrypt.default.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/admin/login")
        .send(loginPayload);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });
});
