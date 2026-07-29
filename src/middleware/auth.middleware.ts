import { NextFunction, Request, Response } from "express";
import catchAsync from "../shared/utils/asyncHandler";
import { Role } from "../../generated/prisma/client";
import config from "../config/db";
import { jwtUtils } from "../shared/utils/logger";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        id: string;
        role: Role;
      };
    }
  }
}

const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;
    if (!token) {
      throw new Error("No token provided");
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_Secret);

    if (!verifiedToken.success) {
      throw new Error(verifiedToken.message);
    }
    const { email, id, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        statusCode: httpStatus.FORBIDDEN,
        message: "You do not have permission to access this resource",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        statusCode: httpStatus.FORBIDDEN,
        message: "Your account is not active",
      });
    }

    req.user = { email, id, role };
    next();
  });
};

export default auth;
