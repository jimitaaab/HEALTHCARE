import bcrypt from "bcryptjs";
import config from "../config/db";
import { jwtUtils } from "../shared/utils/logger";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, Number(config.bcryptSaltRounds));
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (
  userId: string,
  email: string,
  role: string,
): string => {
  return jwtUtils.createToken(
    { id: userId, email, role },
    config.jwt_access_Secret,
    config.jwt_access_ExpiresIn,
  );
};
