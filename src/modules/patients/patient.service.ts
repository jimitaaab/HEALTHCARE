import { prisma } from "../../config/prisma";
import { PatientFilters, UpdatePatientPayload, PatientSearchQuery } from "./patient.interface";

const getAllPatients = async (filters: PatientFilters) => {
  const { search, page = 1, limit = 10 } = filters;

  const where: Record<string, any> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        dateOfBirth: true,
        phone: true,
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total, page, limit };
};

const getPatientById = async (
  patientId: string,
  userId: string,
  userRole: string,
) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        take: 5,
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      },
    },
  });

  if (!patient) throw new Error("Patient not found");

  if (userRole === "PATIENT" && patient.id !== userId) {
    throw new Error("You can only view your own profile");
  }

  if (userRole === "DOCTOR") {
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId: userId,
      },
    });

    if (!hasAppointment) throw new Error("You can only view your assigned patients");
  }

  return patient;
};

const updatePatient = async (
  patientId: string,
  payload: UpdatePatientPayload,
  userId: string,
  userRole: string,
) => {
  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
  });
  if (!existing) throw new Error("Patient not found");

  if (userRole === "PATIENT" && patientId !== userId) {
    throw new Error("You can only update your own profile");
  }

  const data: Record<string, any> = {};

  if (payload.phone !== undefined) data.phone = payload.phone;

  if (userRole === "ADMIN") {
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.gender !== undefined) data.gender = payload.gender;
    if (payload.dateOfBirth !== undefined) data.dateOfBirth = new Date(payload.dateOfBirth);
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
    },
  });

  return patient;
};

const searchPatients = async (
  query: PatientSearchQuery,
  userId: string,
  userRole: string,
) => {
  const where: Record<string, any> = {};

  if (userRole === "DOCTOR") {
    const assignedPatientIds = await prisma.appointment.findMany({
      where: { doctorId: userId },
      select: { patientId: true },
      distinct: ["patientId"],
    });
    where.id = { in: assignedPatientIds.map((a) => a.patientId) };
  }

  const filters: Record<string, any>[] = [];

  if (query.name) {
    filters.push({ name: { contains: query.name, mode: "insensitive" } });
  }

  if (query.condition) {
    filters.push({
      medicalRecords: {
        some: {
          diagnoses: {
            some: {
              condition: { contains: query.condition, mode: "insensitive" },
            },
          },
        },
      },
    });
  }

  if (query.medication) {
    filters.push({
      prescriptions: {
        some: {
          drug: { contains: query.medication, mode: "insensitive" },
        },
      },
    });
  }

  if (filters.length > 0) {
    where.AND = filters;
  }

  const patients = await prisma.patient.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return patients;
};

export const patientService = {
  getAllPatients,
  getPatientById,
  updatePatient,
  searchPatients,
};
