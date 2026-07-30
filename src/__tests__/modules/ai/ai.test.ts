import { jest } from "@jest/globals";
import { mockPrisma, resetMocks } from "../../mocks/prisma";
import express from "express";

jest.unstable_mockModule("../../../config/prisma", () => ({
  prisma: mockPrisma,
}));

const { default: request } = await import("supertest");
const { createPatientToken } = await import("../../helpers");

import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cookieParser());

const { aiRoutes } = await import("../../../modules/ai/ai.routes");
app.use("/api/ai", aiRoutes);

const { default: errorHandler } = await import("../../../middleware/error.middleware");
app.use(errorHandler);

describe("AI Module", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("POST /api/ai/symptom-check", () => {
    it("should analyze symptoms and return a specialty suggestion", async () => {
      const res = await request(app)
        .post("/api/ai/symptom-check")
        .set("Authorization", `Bearer ${createPatientToken()}`)
        .send({ symptoms: "chest pain" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Symptom analysis complete");
      expect(res.body.data).toMatchObject({
        suggestedSpecialty: expect.any(String),
        urgency: expect.any(String),
      });
      expect(res.body.data.suggestedSpecialty).toBe("Cardiology");
      expect(res.body.data.urgency).toBe("high");
    });

    it("should return 400 when symptoms are empty", async () => {
      const res = await request(app)
        .post("/api/ai/symptom-check")
        .set("Authorization", `Bearer ${createPatientToken()}`)
        .send({ symptoms: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Symptoms description is required");
    });

    it("should return 400 when symptoms field is missing", async () => {
      const res = await request(app)
        .post("/api/ai/symptom-check")
        .set("Authorization", `Bearer ${createPatientToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
