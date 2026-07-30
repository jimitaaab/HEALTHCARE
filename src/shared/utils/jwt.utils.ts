import jwt, { JwtPayload } from "jsonwebtoken";

const verifyToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return { success: true as const, data: decoded };
  } catch (error: any) {
    return { success: false as const, message: error.message };
  }
};

const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

export const jwtUtils = {
  verifyToken,
  decodeToken,
};
