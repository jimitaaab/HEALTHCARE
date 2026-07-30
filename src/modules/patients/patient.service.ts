import { prisma } from "../../config/prisma";
import {
  PatientFilters,
  UpdatePatientPayload,
  PatientSearchQuery,
  BookAppointmentPayload,
  RescheduleAppointmentPayload,
} from "./patient.interface";

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
      records: {
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

const getMyProfile = async (userId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
    },
  });

  if (!patient) throw new Error("Patient not found");
  return patient;
};

const updateMyProfile = async (userId: string, payload: UpdatePatientPayload) => {
  const existing = await prisma.patient.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("Patient not found");

  const data: Record<string, any> = {};
  if (payload.phone !== undefined) data.phone = payload.phone;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.gender !== undefined) data.gender = payload.gender;
  if (payload.dateOfBirth !== undefined) data.dateOfBirth = new Date(payload.dateOfBirth);

  const patient = await prisma.patient.update({
    where: { id: userId },
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

const getMyAppointments = async (userId: string) => {
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: { patientId: userId, scheduledAt: { gte: now } },
    orderBy: { scheduledAt: "asc" },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointments;
};

const bookAppointment = async (userId: string, payload: BookAppointmentPayload) => {
  const appointmentDate = new Date(payload.scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: payload.doctorId,
      scheduledAt: appointmentDate,
      status: { in: ["BOOKED", "CHECKED_IN"] as any },
    },
  });

  if (conflict) throw new Error("Time slot already booked");

  const appointment = await prisma.appointment.create({
    data: {
      patientId: userId,
      doctorId: payload.doctorId,
      scheduledAt: appointmentDate,
      status: "BOOKED" as any,
    },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const rescheduleAppointment = async (
  appointmentId: string,
  userId: string,
  payload: RescheduleAppointmentPayload,
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.patientId !== userId) throw new Error("You can only reschedule your own appointments");

  const newDate = new Date(payload.scheduledAt);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: existing.doctorId,
      scheduledAt: newDate,
      id: { not: appointmentId },
      status: { in: ["BOOKED", "CHECKED_IN"] as any },
    },
  });

  if (conflict) throw new Error("New time slot already booked");

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { scheduledAt: newDate },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const cancelMyAppointment = async (appointmentId: string, userId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.patientId !== userId) throw new Error("You can only cancel your own appointments");

  if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
    throw new Error("Cannot cancel a completed or already cancelled appointment");
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" as any },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

export const patientService = {
  getAllPatients,
  getPatientById,
  updatePatient,
  searchPatients,
  getMyProfile,
  updateMyProfile,
  getMyAppointments,
  bookAppointment,
  rescheduleAppointment,
  cancelMyAppointment,
};
