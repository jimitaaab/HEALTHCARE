import { jest } from "@jest/globals";

jest.unstable_mockModule("../../shared/utils/jwt.utils", () => ({
  jwtUtils: {
    verifyToken: jest.fn(),
    decodeToken: jest.fn(),
  },
}));

jest.unstable_mockModule("../../config/env", () => ({
  default: {
    jwt_access_Secret: "test-secret",
    jwt_refresh_Secret: "test-refresh-secret",
    jwt_access_ExpiresIn: "1h",
    jwt_refresh_ExpiresIn: "7d",
    bcryptSaltRounds: "10",
    PORT: "5000",
    app_url: "http://localhost:5000",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  },
}));

const { default: auth } = await import("../../middleware/auth.middleware");
const { jwtUtils } = await import("../../shared/utils/jwt.utils");

describe("Auth Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      cookies: {},
      headers: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should call next with error when no token is provided", async () => {
    await auth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toBe("No token provided");
  });

  it("should call next with error when token is empty string", async () => {
    mockReq.headers.authorization = "";

    await auth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toBe("No token provided");
  });

  it("should set req.user and call next when token is valid (via cookie)", async () => {
    mockReq.cookies.accessToken = "valid-token";
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
      success: true,
      data: { email: "test@example.com", id: "user-id-1", role: "PATIENT" },
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user).toEqual({
      email: "test@example.com",
      id: "user-id-1",
      role: "PATIENT",
    });
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should set req.user and call next when token is valid (via Bearer header)", async () => {
    mockReq.headers.authorization = "Bearer bearer-valid-token";
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
      success: true,
      data: { email: "doctor@test.com", id: "doc-id-1", role: "DOCTOR" },
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual({
      email: "doctor@test.com",
      id: "doc-id-1",
      role: "DOCTOR",
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should set req.user and call next when token is valid (via raw header)", async () => {
    mockReq.headers.authorization = "raw-token-value";
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
      success: true,
      data: { email: "admin@test.com", id: "admin-id-1", role: "ADMIN" },
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockReq.user).toEqual({
      email: "admin@test.com",
      id: "admin-id-1",
      role: "ADMIN",
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next with error when token is invalid", async () => {
    mockReq.cookies.accessToken = "invalid-token";
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
      success: false,
      message: "jwt malformed",
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toBe("jwt malformed");
  });

  it("should call next with error when token is expired", async () => {
    mockReq.cookies.accessToken = "expired-token";
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
      success: false,
      message: "jwt expired",
    });

    await auth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toBe("jwt expired");
  });
});
