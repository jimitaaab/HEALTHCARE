import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const { jwtUtils } = await import("../../../shared/utils/jwt.utils");

describe("jwtUtils", () => {
  const secret = "test-secret-key";
  const payload = { id: "user-1", email: "test@test.com", role: "PATIENT" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyToken", () => {
    it("should return success true with decoded data for valid token", () => {
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });

      const result = jwtUtils.verifyToken(token, secret);

      expect(result.success).toBe(true);
      expect((result as any).data).toMatchObject({
        id: "user-1",
        email: "test@test.com",
        role: "PATIENT",
      });
    });

    it("should return success false with message for invalid token", () => {
      const result = jwtUtils.verifyToken("invalid-token", secret);

      expect(result.success).toBe(false);
      expect((result as any).message).toBeDefined();
    });

    it("should return success false for token signed with different secret", () => {
      const token = jwt.sign(payload, "different-secret", { expiresIn: "1h" });

      const result = jwtUtils.verifyToken(token, secret);

      expect(result.success).toBe(false);
      expect((result as any).message).toBeDefined();
    });

    it("should return success false for expired token", () => {
      const token = jwt.sign(payload, secret, { expiresIn: "0s" });

      const result = jwtUtils.verifyToken(token, secret);

      expect(result.success).toBe(false);
      expect((result as any).message).toMatch(/expired/i);
    });

    it("should return success false for malformed token", () => {
      const result = jwtUtils.verifyToken("not-a-json-web-token", secret);

      expect(result.success).toBe(false);
      expect((result as any).message).toBeDefined();
    });

    it("should return success false for empty token", () => {
      const result = jwtUtils.verifyToken("", secret);

      expect(result.success).toBe(false);
      expect((result as any).message).toBeDefined();
    });
  });

  describe("decodeToken", () => {
    it("should decode a valid token without verification", () => {
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });

      const decoded = jwtUtils.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        id: "user-1",
        email: "test@test.com",
        role: "PATIENT",
      });
    });

    it("should decode an expired token (decode does not verify)", () => {
      const token = jwt.sign(payload, secret, { expiresIn: "0s" });

      const decoded = jwtUtils.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe("user-1");
    });

    it("should return null for completely invalid token string", () => {
      const decoded = jwtUtils.decodeToken("not-a-token");

      expect(decoded).toBeNull();
    });

    it("should return null for empty string", () => {
      const decoded = jwtUtils.decodeToken("");

      expect(decoded).toBeNull();
    });

    it("should return null for non-string input", () => {
      const decoded = jwtUtils.decodeToken(null as any);

      expect(decoded).toBeNull();
    });
  });
});
