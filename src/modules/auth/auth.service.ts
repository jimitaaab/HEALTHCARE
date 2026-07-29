import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { loginUserPayload } from "./auth.interface";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

const loginUser = async (payload: loginUserPayload) => {
  const { email, password } = payload;
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatched) {
    throw new Error("Invalid password");
  }

  const jwtpayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtpayload,
    config.jwt_access_Secret,
    config.jwt_access_ExpiresIn as jwt.SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtpayload,
    config.jwt_refresh_Secret,
    config.jwt_refresh_ExpiresIn as jwt.SignOptions,
  );

  return { accessToken, refreshToken };
};

const refreshToken = async (token: string) => {
  try {
    const verifyRefreshtoken = jwtUtils.verifyToken(
      token,
      config.jwt_refresh_Secret,
    );
    if (!verifyRefreshtoken.success) {
      throw new Error(verifyRefreshtoken.message);
    }

    const { id } = verifyRefreshtoken.data as JwtPayload;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
    });

    if (!user.isActive) {
      throw new Error("User is not active");
    }

    const jwtpayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtpayload,
      config.jwt_access_Secret,
      config.jwt_access_ExpiresIn as jwt.SignOptions,
    );

    return { accessToken };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const authService = {
  loginUser,
  refreshToken,
};
