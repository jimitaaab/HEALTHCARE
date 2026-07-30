import { jest } from "@jest/globals";

const { default: sendResponse } = await import("../../../shared/utils/apiResponse");

describe("sendResponse", () => {
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("should send response with status code and data", () => {
    const data = {
      success: true,
      statusCode: 200,
      message: "Success",
      data: { id: "1", name: "Test" },
    };

    sendResponse(mockRes, data);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      message: "Success",
      data: { id: "1", name: "Test" },
      meta: undefined,
    });
  });

  it("should send response with meta when provided", () => {
    const data = {
      success: true,
      statusCode: 200,
      message: "List retrieved",
      data: [{ id: "1" }, { id: "2" }],
      meta: { page: 1, limit: 10, total: 2 },
    };

    sendResponse(mockRes, data);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      message: "List retrieved",
      data: [{ id: "1" }, { id: "2" }],
      meta: { page: 1, limit: 10, total: 2 },
    });
  });

  it("should send error response with success false", () => {
    const data = {
      success: false,
      statusCode: 404,
      message: "Resource not found",
      data: null,
    };

    sendResponse(mockRes, data);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      statusCode: 404,
      message: "Resource not found",
      data: null,
      meta: undefined,
    });
  });

  it("should send response with created status code", () => {
    const data = {
      success: true,
      statusCode: 201,
      message: "Created",
      data: { id: "new-id" },
    };

    sendResponse(mockRes, data);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 201,
      message: "Created",
      data: { id: "new-id" },
      meta: undefined,
    });
  });

  it("should handle empty data", () => {
    const data = {
      success: true,
      statusCode: 200,
      message: "Success",
      data: {},
    };

    sendResponse(mockRes, data);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      statusCode: 200,
      message: "Success",
      data: {},
      meta: undefined,
    });
  });
});
