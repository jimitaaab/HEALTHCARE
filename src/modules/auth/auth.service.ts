import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import config from "../../config/env";
import { RegisterPayload, AdminSignupPayload, LoginPayload, AuthResponse } from "./auth.interface";

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, Number(config.bcryptSaltRounds));
};

const generateAccessToken = (
  userId: string,
  email: string,
  role: string,
): string => {
  return jwt.sign({ id: userId, email, role }, config.jwt_access_Secret, {
    expiresIn: config.jwt_access_ExpiresIn,
  } as jwt.SignOptions);
};

const findUserByEmail = async (email: string) => {
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (patient) return { ...patient, role: "PATIENT" as const };

  const doctor = await prisma.doctor.findUnique({ where: { email } });
  if (doctor) return { ...doctor, role: "DOCTOR" as const };

  const receptionist = await prisma.receptionist.findUnique({ where: { email } });
  if (receptionist) return { ...receptionist, role: "RECEPTIONIST" as const };

  return null;
};

const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const existing = await findUserByEmail(payload.email);
  if (existing) throw new Error("A user with this email already exists");

  const hashed = await hashPassword(payload.password);

  const patient = await prisma.patient.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashed,
      gender: payload.gender,
      dateOfBirth: new Date(payload.dateOfBirth),
      phone: payload.phone,
    },
  });

  const accessToken = generateAccessToken(patient.id, patient.email, "PATIENT");

  return {
    accessToken,
    user: { id: patient.id, email: patient.email, role: "PATIENT" },
  };
};

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const user = await findUserByEmail(payload.email);
  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) throw new Error("Invalid email or password");

  const accessToken = generateAccessToken(user.id, user.email, user.role);

  return {
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

const adminSignup = async (payload: AdminSignupPayload): Promise<AuthResponse> => {
  const existing = await prisma.admin.findUnique({ where: { email: payload.email } });
  if (existing) throw new Error("An admin with this email already exists");

  const hashed = await hashPassword(payload.password);

  const admin = await prisma.admin.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashed,
    },
  });

  const accessToken = generateAccessToken(admin.id, admin.email, "ADMIN");

  return {
    accessToken,
    user: { id: admin.id, email: admin.email, role: "ADMIN" },
  };
};

const adminLogin = async (payload: LoginPayload): Promise<AuthResponse> => {
  const admin = await prisma.admin.findUnique({ where: { email: payload.email } });
  if (!admin) throw new Error("Invalid admin credentials");

  const valid = await bcrypt.compare(payload.password, admin.password);
  if (!valid) throw new Error("Invalid admin credentials");

  const accessToken = generateAccessToken(admin.id, admin.email, "ADMIN");

  return {
    accessToken,
    user: { id: admin.id, email: admin.email, role: "ADMIN" },
  };
};

export const authService = {
  register,
  login,
  adminSignup,
  adminLogin,
};
