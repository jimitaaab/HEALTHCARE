import { prisma } from "../../config/prisma";
import { DoctorFilters, UpdateDoctorPayload, ScheduleQuery } from "./doctor.interface";

const doctorSelect = {
  id: true,
  name: true,
  email: true,
  gender: true,
  specialty: true,
  createdAt: true,
};

const getAllDoctors = async (filters: DoctorFilters) => {
  const { search, specialty, page = 1, limit = 10 } = filters;

  const where: Record<string, any> = {};

  if (specialty) where.specialty = { contains: specialty, mode: "insensitive" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { specialty: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        specialty: true,
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return { doctors, total, page, limit };
};

const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: doctorSelect,
  });

  if (!doctor) throw new Error("Doctor not found");

  return doctor;
};

const getMyProfile = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: userId },
    select: doctorSelect,
  });

  if (!doctor) throw new Error("Doctor not found");

  return doctor;
};

const updateMyProfile = async (userId: string, payload: UpdateDoctorPayload) => {
  const existing = await prisma.doctor.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("Doctor not found");

  const data: Record<string, any> = {};
  if (payload.name) data.name = payload.name;
  if (payload.gender) data.gender = payload.gender;
  if (payload.specialty) data.specialty = payload.specialty;

  const doctor = await prisma.doctor.update({
    where: { id: userId },
    data,
    select: doctorSelect,
  });

  return doctor;
};

const getMySchedule = async (userId: string, query: ScheduleQuery) => {
  const startDate = query.date ? new Date(query.date) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: userId,
      scheduledAt: { gte: startDate, lte: endDate },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return { weekStart: startDate, weekEnd: endDate, appointments };
};

const getMyAppointments = async (userId: string) => {
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: userId,
      scheduledAt: { gte: now },
      status: { in: ["BOOKED", "CHECKED_IN"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return appointments;
};

export const doctorService = {
  getAllDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getMySchedule,
  getMyAppointments,
};
