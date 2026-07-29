import { prisma } from "../lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import config from "../config/db";
import { SignupPayload, LoginPayload, AuthResponse } from "./auth.interface";
import { hashPassword, generateAccessToken } from "./auth.utils";

const generateTokens = async (
  userId: string,
  email: string,
  role: string,
): Promise<AuthResponse> => {
  const accessToken = generateAccessToken(userId, email, role);

  const rawRefreshToken = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(
    rawRefreshToken,
    Number(config.bcryptSaltRounds),
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: { id: userId, email, role },
  };
};

const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existing) throw new Error("User already exists with this email");

  const hashedPassword = await hashPassword(payload.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: payload.email,
        passwordHash: hashedPassword,
        role: "PATIENT",
      },
    });

    await tx.patient.create({
      data: {
        userId: created.id,
        name: payload.name,
        dob: new Date(payload.dob),
        gender: payload.gender as any,
        contactInfo: payload.contactInfo,
      },
    });

    return created;
  });

  return generateTokens(user.id, user.email, user.role);
};

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) throw new Error("Invalid email or password");
  if (!user.isActive) throw new Error("Your account has been deactivated");

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );
  if (!isPasswordValid) throw new Error("Invalid email or password");

  return generateTokens(user.id, user.email, user.role);
};

const logout = async (rawRefreshToken: string): Promise<void> => {
  const tokens = await prisma.refreshToken.findMany({
    where: { revokedAt: null },
    select: { id: true, tokenHash: true },
  });

  for (const token of tokens) {
    const isMatch = await bcrypt.compare(rawRefreshToken, token.tokenHash);
    if (isMatch) {
      await prisma.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });
      return;
    }
  }
};

const refreshToken = async (
  rawRefreshToken: string,
): Promise<AuthResponse> => {
  const tokens = await prisma.refreshToken.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  for (const token of tokens) {
    const isMatch = await bcrypt.compare(rawRefreshToken, token.tokenHash);
    if (isMatch) {
      await prisma.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });

      return generateTokens(
        token.user.id,
        token.user.email,
        token.user.role,
      );
    }
  }

  throw new Error("Invalid or expired refresh token");
};

export const authService = {
  signup,
  login,
  logout,
  refreshToken,
};
