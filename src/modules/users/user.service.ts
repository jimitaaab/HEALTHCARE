import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import config from "../../config";
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserFilters,
} from "./user.interface";
import { Prisma } from "../../../generated/prisma/client";

const createUser = async (payload: CreateUserPayload) => {
  const { email, password, role, name, dob, gender, contactInfo, specialty } =
    payload;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcryptSaltRounds),
  );

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
      },
    });

    if (role === "PATIENT") {
      await tx.patient.create({
        data: {
          userId: created.id,
          name: name ?? email,
          dob: dob ? new Date(dob) : new Date(),
          gender: (gender as any) ?? "OTHER",
          contactInfo,
        },
      });
    }

    if (role === "DOCTOR") {
      await tx.doctor.create({
        data: {
          userId: created.id,
          name: name ?? email,
          gender: (gender as any) ?? "OTHER",
          specialty: specialty ?? "General",
        },
      });
    }

    return created;
  });

  return user;
};

const getUsers = async (filters: UserFilters) => {
  const { search, role, isActive, page = 1, limit = 10 } = filters;

  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
};

const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  const data: Prisma.UserUpdateInput = {};

  if (payload.email !== undefined) data.email = payload.email;
  if (payload.role !== undefined) data.role = payload.role;
  if (payload.isActive !== undefined) data.isActive = payload.isActive;
  if (payload.password) {
    data.passwordHash = await bcrypt.hash(
      payload.password,
      Number(config.bcryptSaltRounds),
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return user;
};

export const userService = {
  createUser,
  getUsers,
  updateUser,
};
