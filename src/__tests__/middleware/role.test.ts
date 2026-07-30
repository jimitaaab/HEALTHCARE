import { jest } from "@jest/globals";

const { default: requireRole } = await import("../../middleware/role.middleware");

describe("requireRole Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { user: undefined };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should return 401 if req.user is undefined", () => {
    const middleware = requireRole("ADMIN", "DOCTOR");
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 401,
      message: "Authentication required",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if req.user is null", () => {
    mockReq.user = null;
    const middleware = requireRole("ADMIN");
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 401,
      message: "Authentication required",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if user role is not in allowed roles", () => {
    mockReq.user = { id: "1", email: "test@test.com", role: "PATIENT" };
    const middleware = requireRole("ADMIN", "DOCTOR");
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 403,
      message: "You do not have permission to access this resource",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() if user role matches a single allowed role", () => {
    mockReq.user = { id: "1", email: "admin@test.com", role: "ADMIN" };
    const middleware = requireRole("ADMIN");
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should call next() if user role matches one of multiple allowed roles", () => {
    mockReq.user = { id: "1", email: "doctor@test.com", role: "DOCTOR" };
    const middleware = requireRole("ADMIN", "DOCTOR", "RECEPTIONIST");
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next() if user role matches the last allowed role", () => {
    mockReq.user = { id: "1", email: "receptionist@test.com", role: "RECEPTIONIST" };
    const middleware = requireRole("ADMIN", "DOCTOR", "RECEPTIONIST");
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should work with empty allowed roles (deny all)", () => {
    mockReq.user = { id: "1", email: "test@test.com", role: "ADMIN" };
    const middleware = requireRole();
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
