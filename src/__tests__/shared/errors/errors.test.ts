import { jest } from "@jest/globals";

const {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} = await import("../../../shared/errors/index");

describe("Custom Error Classes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AppError", () => {
    it("should create an AppError with message and statusCode", () => {
      const error = new AppError("Custom error", 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Custom error");
      expect(error.statusCode).toBe(400);
    });

    it("should have correct prototype chain", () => {
      const error = new AppError("Test", 500);

      expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
      expect(error instanceof Error).toBe(true);
    });

    it("should have a stack trace", () => {
      const error = new AppError("Stack test", 500);

      expect(error.stack).toBeDefined();
    });
  });

  describe("NotFoundError", () => {
    it("should create with default message and 404 status", () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Resource not found");
      expect(error.statusCode).toBe(404);
    });

    it("should create with custom resource name", () => {
      const error = new NotFoundError("Patient");

      expect(error.message).toBe("Patient not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("UnauthorizedError", () => {
    it("should create with default message and 401 status", () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe("Authentication required");
      expect(error.statusCode).toBe(401);
    });

    it("should create with custom message", () => {
      const error = new UnauthorizedError("Invalid token");

      expect(error.message).toBe("Invalid token");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("ForbiddenError", () => {
    it("should create with default message and 403 status", () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe("You do not have permission to perform this action");
      expect(error.statusCode).toBe(403);
    });

    it("should create with custom message", () => {
      const error = new ForbiddenError("Access denied");

      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
    });
  });

  describe("ConflictError", () => {
    it("should create with default message and 409 status", () => {
      const error = new ConflictError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe("Resource already exists");
      expect(error.statusCode).toBe(409);
    });

    it("should create with custom message", () => {
      const error = new ConflictError("Email already in use");

      expect(error.message).toBe("Email already in use");
      expect(error.statusCode).toBe(409);
    });
  });

  describe("ValidationError", () => {
    it("should create with default message and 400 status", () => {
      const error = new ValidationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid data provided");
      expect(error.statusCode).toBe(400);
    });

    it("should create with custom message", () => {
      const error = new ValidationError("Name is required");

      expect(error.message).toBe("Name is required");
      expect(error.statusCode).toBe(400);
    });
  });

  describe("Polymorphism", () => {
    it("should correctly identify error types with instanceof", () => {
      const notFound = new NotFoundError();
      const unauthorized = new UnauthorizedError();
      const forbidden = new ForbiddenError();
      const conflict = new ConflictError();
      const validation = new ValidationError();

      expect(notFound).toBeInstanceOf(AppError);
      expect(unauthorized).toBeInstanceOf(AppError);
      expect(forbidden).toBeInstanceOf(AppError);
      expect(conflict).toBeInstanceOf(AppError);
      expect(validation).toBeInstanceOf(AppError);

      expect(notFound).toBeInstanceOf(NotFoundError);
      expect(unauthorized).toBeInstanceOf(UnauthorizedError);
      expect(forbidden).toBeInstanceOf(ForbiddenError);
      expect(conflict).toBeInstanceOf(ConflictError);
      expect(validation).toBeInstanceOf(ValidationError);
    });

    it("should throw and catch error types", () => {
      const throwable = (error: Error) => {
        throw error;
      };

      expect(() => throwable(new NotFoundError())).toThrow(AppError);
      expect(() => throwable(new NotFoundError())).toThrow(NotFoundError);
      expect(() => throwable(new UnauthorizedError())).toThrow(AppError);
      expect(() => throwable(new UnauthorizedError())).toThrow(UnauthorizedError);
    });
  });
});
