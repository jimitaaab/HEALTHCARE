import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";
import { authService } from "./auth.service";

const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.register(req.body);

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
    const { accessToken, user } = await authService.login(req.body);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: { accessToken, user },
    });
  },
);

const adminSignup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.adminSignup(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Admin account created successfully",
      data: result,
    });
  },
);

const adminLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {accessToken,user} = await authService.adminLogin(req.body);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin login successful",
      data: {accessToken,user},
    });
  },
);

export const authController = {
  register,
  login,
  adminSignup,
  adminLogin,
};
