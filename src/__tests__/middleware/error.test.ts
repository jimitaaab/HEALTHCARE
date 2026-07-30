import { jest } from "@jest/globals";

class MockPrismaClientKnownRequestError extends Error {
  public code: string;
  constructor(message: string, { code }: { code: string }) {
    super(message);
    this.code = code;
    this.name = "PrismaClientKnownRequestError";
  }
}

class MockPrismaClientValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrismaClientValidationError";
  }
}

jest.unstable_mockModule("../../../generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
    PrismaClientValidationError: MockPrismaClientValidationError,
  },
}));

const { default: errorHandler } = await import("../../middleware/error.middleware");

describe("Error Handler Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("Prisma Errors", () => {
    it("should return 409 for Prisma P2002 (unique constraint violation)", () => {
      const err = new MockPrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
      });

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 409,
        message: "Unique constraint violation",
      });
    });

    it("should return 404 for Prisma P2025 (record not found)", () => {
      const err = new MockPrismaClientKnownRequestError("Record not found", {
        code: "P2025",
      });

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 404,
        message: "Record not found",
      });
    });

    it("should return 400 for Prisma P2003 (foreign key constraint)", () => {
      const err = new MockPrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
      });

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: "Foreign key constraint failed",
      });
    });

    it("should return 400 for unknown Prisma error codes", () => {
      const err = new MockPrismaClientKnownRequestError("Some database error", {
        code: "P1000",
      });

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: "Some database error",
      });
    });

    it("should return 400 for Prisma ValidationError", () => {
      const err = new MockPrismaClientValidationError("Invalid data provided");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: "Invalid data provided",
      });
    });
  });

  describe("Generic Errors", () => {
    it("should return 409 if error message includes 'already exists'", () => {
      const err = new Error("A user with this email already exists");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 409,
        message: "A user with this email already exists",
      });
    });

    it("should return 404 if error message includes 'not found'", () => {
      const err = new Error("Resource not found");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 404,
        message: "Resource not found",
      });
    });

    it("should return 400 if error message includes 'Invalid'", () => {
      const err = new Error("Invalid email or password");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: "Invalid email or password",
      });
    });

    it("should return 400 if error message includes 'required'", () => {
      const err = new Error("Name is required");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 400,
        message: "Name is required",
      });
    });

    it("should return 500 for generic error with no special message", () => {
      const err = new Error("Something went wrong");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 500,
        message: "Something went wrong",
      });
    });

    it("should return 500 with default message for error with empty message", () => {
      const err = new Error("");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 500,
        message: "Internal server error",
      });
    });

    it("should return 500 and default message when error has no message property", () => {
      const err = { name: "Error" } as Error;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 500,
        message: "Internal server error",
      });
    });
  });
});
