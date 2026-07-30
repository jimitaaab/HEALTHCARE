import { NextFunction, Request, Response } from "express";
import catchAsync from "../shared/utils/asyncHandler";
import config from "../config/db";
import { jwtUtils } from "../shared/utils/logger";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        id: string;
        role: string;
      };
    }
  }
}

const auth = (...requiredRoles: string[]) => {
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

    req.user = { email, id, role };
    next();
  });
};

export default auth;
