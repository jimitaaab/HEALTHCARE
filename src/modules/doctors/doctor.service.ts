import { prisma } from "../../lib/prisma";
import { DoctorFilters, AvailabilityQuery } from "./doctor.interface";
import { Prisma } from "../../../generated/prisma/client";

const getAllDoctors = async (filters: DoctorFilters) => {
  const { search, specialty, page = 1, limit = 10 } = filters;

  const where: Prisma.DoctorWhereInput = { isActive: true };

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
        gender: true,
        specialty: true,
        scheduleConfig: true,
        user: { select: { email: true } },
      },
    }),
    prisma.doctor.count({ where }),
  ]);

  return { doctors, total, page, limit };
};

const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      user: { select: { email: true } },
    },
  });

  if (!doctor) throw new Error("Doctor not found");

  return doctor;
};

const getAvailability = async (
  doctorId: string,
  query: AvailabilityQuery,
) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) throw new Error("Doctor not found");

  const requestedDate = new Date(query.date);
  const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      datetime: { gte: startOfDay, lte: endOfDay },
      status: { in: ["BOOKED", "CHECKED_IN"] },
    },
    select: { datetime: true },
  });

  const scheduleConfig = doctor.scheduleConfig as Record<string, any> | null;
  const slots: string[] = [];

  if (scheduleConfig?.slots) {
    for (const slot of scheduleConfig.slots as string[]) {
      const isBooked = existingAppointments.some(
        (apt) =>
          new Date(apt.datetime).toISOString() ===
          new Date(`${query.date}T${slot}`).toISOString(),
      );
      if (!isBooked) slots.push(slot);
    }
  }

  return { doctorId: doctor.id, date: query.date, availableSlots: slots };
};

export const doctorService = {
  getAllDoctors,
  getDoctorById,
  getAvailability,
};
