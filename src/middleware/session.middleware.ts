import { NextFunction, Request, Response } from "express";
import catchAsync from "../shared/utils/asyncHandler";
import config from "../config";
import { jwtUtils } from "../shared/utils/logger";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { prisma } from "../lib/prisma";

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

    const { id } = verifiedToken.data as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.isActive) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "User session no longer valid",
      });
    }

    next();
  },
);

export default session;
