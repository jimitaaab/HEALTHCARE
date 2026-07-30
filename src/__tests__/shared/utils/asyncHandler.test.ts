import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

const { default: catchAsync } = await import("../../../shared/utils/asyncHandler");

describe("catchAsync", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should call the wrapped function with req, res, next", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next with error when wrapped function throws", async () => {
    const error = new Error("Something went wrong");
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should call next with error when wrapped function throws a non-Error value", async () => {
    const error = "string error message";
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should call next with error when wrapped function throws an object", async () => {
    const error = { code: 400, message: "Bad request" };
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should call next with error when wrapped function throws a Prisma-like error", async () => {
    const error = new Error("Unique constraint violation");
    (error as any).code = "P2002";
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should not call next if wrapped function resolves successfully", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle synchronous throws inside the wrapped function", async () => {
    const error = new Error("Sync error");
    const fn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const wrapped = catchAsync(fn);

    await wrapped(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
