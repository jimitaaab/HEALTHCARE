import { NextFunction, Request, Response } from "express";
import catchAsync from "../shared/utils/asyncHandler";
import config from "../config/db";
import { jwtUtils } from "../shared/utils/logger";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

const session = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "No session token provided",
      });
    }

    const verifiedToken = jwtUtils.verifyToken(
      token,
      config.jwt_access_Secret,
    );

    if (!verifiedToken.success) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Session expired or invalid",
      });
    }

    next();
  },
);

export default session;
