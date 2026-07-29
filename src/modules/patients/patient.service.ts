import { prisma } from "../../lib/prisma";
import { PatientFilters, UpdatePatientPayload, PatientSearchQuery } from "./patient.interface";
import { Prisma } from "../../../generated/prisma/client";

const getAllPatients = async (filters: PatientFilters) => {
  const { search, page = 1, limit = 10 } = filters;

  const where: Prisma.PatientWhereInput = { isActive: true };

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
        gender: true,
        dob: true,
        contactInfo: true,
        user: { select: { email: true } },
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
      user: { select: { email: true } },
      appointments: {
        take: 5,
        orderBy: { datetime: "desc" },
        select: {
          id: true,
          datetime: true,
          status: true,
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      },
    },
  });

  if (!patient) throw new Error("Patient not found");

  if (userRole === "PATIENT") {
    const patientProfile = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patientProfile || patientProfile.id !== patientId) {
      throw new Error("You can only view your own profile");
    }
  }

  if (userRole === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new Error("Doctor profile not found");

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId: doctor.id,
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

  if (userRole === "PATIENT") {
    const patientProfile = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patientProfile || patientProfile.id !== patientId) {
      throw new Error("You can only update your own profile");
    }
  }

  const data: Prisma.PatientUpdateInput = {};

  if (payload.contactInfo !== undefined) data.contactInfo = payload.contactInfo;
  if (payload.demographics !== undefined) data.demographics = payload.demographics;

  if (userRole === "ADMIN") {
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.gender !== undefined) data.gender = payload.gender;
    if (payload.dob !== undefined) data.dob = new Date(payload.dob);
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data,
    select: {
      id: true,
      name: true,
      gender: true,
      dob: true,
      contactInfo: true,
      demographics: true,
      user: { select: { email: true } },
    },
  });

  return patient;
};

const searchPatients = async (
  query: PatientSearchQuery,
  userId: string,
  userRole: string,
) => {
  const where: Prisma.PatientWhereInput = { isActive: true };

  if (userRole === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (doctor) {
      const assignedPatientIds = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        select: { patientId: true },
        distinct: ["patientId"],
      });
      where.id = { in: assignedPatientIds.map((a) => a.patientId) };
    }
  }

  const filters: Prisma.PatientWhereInput[] = [];

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
      gender: true,
      dob: true,
      contactInfo: true,
      user: { select: { email: true } },
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
