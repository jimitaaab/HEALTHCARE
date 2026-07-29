import { NextFunction, Request, Response } from "express";
import catchAsync from "../shared/utils/asyncHandler";
import { authService } from "./auth.service";
import sendResponse from "../shared/utils/apiResponse";
import httpStatus from "http-status-codes";

const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.signup(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Account created successfully",
      data: result,
    });
  },
);

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.login(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: result,
    });
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.refreshToken;
    if (!token) throw new Error("Refresh token is required");

    await authService.logout(token);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Logged out successfully",
      data: null,
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.refreshToken;
    if (!token) throw new Error("Refresh token is required");

    const result = await authService.refreshToken(token);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Token refreshed successfully",
      data: result,
    });
  },
);

export const authController = {
  signup,
  login,
  logout,
  refreshToken,
};
