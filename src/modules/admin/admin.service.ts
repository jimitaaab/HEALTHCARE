import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import config from "../../config/env";
import {
  RoleType,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilters,
} from "./admin.types";

const hashPassword = (password: string) =>
  bcrypt.hash(password, Number(config.bcryptSaltRounds));

const findUserByEmail = async (email: string) => {
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (patient) return "PATIENT";
  const doctor = await prisma.doctor.findUnique({ where: { email } });
  if (doctor) return "DOCTOR";
  const receptionist = await prisma.receptionist.findUnique({ where: { email } });
  if (receptionist) return "RECEPTIONIST";
  return null;
};

const listUsers = async (filters: UserFilters) => {
  const { role, search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const nameFilter = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : undefined;

  const paginate = { skip, take: limit };

  const users: Array<{ id: string; name: string; email: string; role: string; createdAt: Date }> = [];

  if (!role || role === "PATIENT") {
    const rows = await prisma.patient.findMany({
      where: { ...(nameFilter || {}) },
      ...paginate,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, gender: true, createdAt: true },
    });
    users.push(...rows.map((r) => ({ ...r, role: "PATIENT" })));
  }

  if (!role || role === "DOCTOR") {
    const rows = await prisma.doctor.findMany({
      where: { ...(nameFilter || {}) },
      ...paginate,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, specialty: true, createdAt: true },
    });
    users.push(...rows.map((r) => ({ ...r, role: "DOCTOR" })));
  }

  if (!role || role === "RECEPTIONIST") {
    const rows = await prisma.receptionist.findMany({
      where: { ...(nameFilter || {}) },
      ...paginate,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    users.push(...rows.map((r) => ({ ...r, role: "RECEPTIONIST" })));
  }

  return { users, total: users.length, page, limit };
};

const createUser = async (role: RoleType, payload: CreateUserPayload) => {
  const existing = await findUserByEmail(payload.email);
  if (existing) throw new Error("A user with this email already exists");

  const hashed = await hashPassword(payload.password);

  switch (role) {
    case "PATIENT":
      return prisma.patient.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: hashed,
          gender: payload.gender ?? "OTHER",
          dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : new Date(),
          phone: payload.phone,
        },
      });
    case "DOCTOR":
      return prisma.doctor.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: hashed,
          gender: payload.gender ?? "OTHER",
          specialty: payload.specialty ?? "General",
        },
      });
    case "RECEPTIONIST":
      return prisma.receptionist.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: hashed,
        },
      });
  }
};

const updateUser = async (role: RoleType, id: string, payload: UpdateUserPayload) => {
  const data: Record<string, any> = {};
  if (payload.name) data.name = payload.name;
  if (payload.email) data.email = payload.email;
  if (payload.password) data.password = await hashPassword(payload.password);

  switch (role) {
    case "PATIENT": {
      const existing = await prisma.patient.findUnique({ where: { id } });
      if (!existing) throw new Error("Patient not found");
      if (payload.gender) data.gender = payload.gender;
      if (payload.dateOfBirth) data.dateOfBirth = new Date(payload.dateOfBirth);
      if (payload.phone) data.phone = payload.phone;
      return prisma.patient.update({ where: { id }, data });
    }
    case "DOCTOR": {
      const existing = await prisma.doctor.findUnique({ where: { id } });
      if (!existing) throw new Error("Doctor not found");
      if (payload.gender) data.gender = payload.gender;
      if (payload.specialty) data.specialty = payload.specialty;
      return prisma.doctor.update({ where: { id }, data });
    }
    case "RECEPTIONIST": {
      const existing = await prisma.receptionist.findUnique({ where: { id } });
      if (!existing) throw new Error("Receptionist not found");
      return prisma.receptionist.update({ where: { id }, data });
    }
  }
};

const deleteUser = async (role: RoleType, id: string) => {
  switch (role) {
    case "PATIENT": {
      const existing = await prisma.patient.findUnique({ where: { id } });
      if (!existing) throw new Error("Patient not found");
      return prisma.patient.delete({ where: { id } });
    }
    case "DOCTOR": {
      const existing = await prisma.doctor.findUnique({ where: { id } });
      if (!existing) throw new Error("Doctor not found");
      return prisma.doctor.delete({ where: { id } });
    }
    case "RECEPTIONIST": {
      const existing = await prisma.receptionist.findUnique({ where: { id } });
      if (!existing) throw new Error("Receptionist not found");
      return prisma.receptionist.delete({ where: { id } });
    }
  }
};

const demographicsAnalytics = async () => {
  const patients = await prisma.patient.findMany({
    select: { gender: true },
  });

  const breakdown: Record<string, number> = {};
  for (const p of patients) {
    breakdown[p.gender] = (breakdown[p.gender] || 0) + 1;
  }

  const total = patients.length;
  return { total, breakdown };
};

const diagnosesAnalytics = async () => {
  const diagnoses = await prisma.diagnosis.groupBy({
    by: ["condition"],
    _count: { condition: true },
    orderBy: { _count: { condition: "desc" } },
    take: 10,
  });

  return diagnoses.map((d) => ({
    condition: d.condition,
    count: d._count.condition,
  }));
};

const appointmentsAnalytics = async () => {
  const appointments = await prisma.appointment.findMany({
    select: { scheduledAt: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const trends: Record<string, { total: number; completed: number; cancelled: number }> = {};

  for (const a of appointments) {
    const key = a.createdAt.toISOString().slice(0, 7);
    if (!trends[key]) trends[key] = { total: 0, completed: 0, cancelled: 0 };
    trends[key].total++;
    if (a.status === "COMPLETED") trends[key].completed++;
    if (a.status === "CANCELLED") trends[key].cancelled++;
  }

  const volume = Object.entries(trends).map(([month, counts]) => ({
    month,
    ...counts,
  }));

  return { volume };
};

export const adminService = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  demographicsAnalytics,
  diagnosesAnalytics,
  appointmentsAnalytics,
};
