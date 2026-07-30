import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import config from "../config/db";
import { SignupPayload, LoginPayload, AuthResponse } from "./auth.interface";
import { hashPassword, generateAccessToken } from "./auth.utils";

const findUserByEmail = async (email: string) => {
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (patient) return { ...patient, role: "PATIENT" as const };

  const doctor = await prisma.doctor.findUnique({ where: { email } });
  if (doctor) return { ...doctor, role: "DOCTOR" as const };

  const receptionist = await prisma.receptionist.findUnique({ where: { email } });
  if (receptionist) return { ...receptionist, role: "RECEPTIONIST" as const };

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin) return { ...admin, role: "ADMIN" as const };

  return null;
};

const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const existing = await findUserByEmail(payload.email);
  if (existing) throw new Error("User already exists with this email");

  const hashedPassword = await hashPassword(payload.password);

  const patient = await prisma.patient.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      name: payload.name,
      dateOfBirth: new Date(payload.dateOfBirth),
      gender: payload.gender,
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

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) throw new Error("Invalid email or password");

  const accessToken = generateAccessToken(user.id, user.email, user.role);

  return {
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

export const authService = {
  signup,
  login,
};
