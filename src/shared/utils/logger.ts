import jwt, { JwtPayload } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number,
) => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

const verifyToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return {
      success: true,
      data: decoded,
    };
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
