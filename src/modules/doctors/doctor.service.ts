import { prisma } from "../../lib/prisma";
import { DoctorFilters } from "./doctor.interface";

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
  });

  if (!doctor) throw new Error("Doctor not found");

  return doctor;
};

export const doctorService = {
  getAllDoctors,
  getDoctorById,
};
