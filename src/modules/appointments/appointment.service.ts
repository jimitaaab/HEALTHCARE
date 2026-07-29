import { prisma } from "../../lib/prisma";
import {
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  AppointmentFilters,
  OverridePayload,
} from "./appointment.interface";
import { Prisma, AppointmentStatus } from "../../../generated/prisma/client";

const getAppointments = async (
  filters: AppointmentFilters,
  userId: string,
  userRole: string,
) => {
  const { date, doctorId, status, page = 1, limit = 10 } = filters;
  const where: Prisma.AppointmentWhereInput = {};

  if (userRole === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });
    if (!doctor) throw new Error("Doctor profile not found");
    where.doctorId = doctor.id;
  } else if (userRole === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) throw new Error("Patient profile not found");
    where.patientId = patient.id;
  }

  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    where.datetime = { gte: startDate, lte: endDate };
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { datetime: "desc" },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page, limit };
};

const createAppointment = async (payload: CreateAppointmentPayload) => {
  const { patientId, doctorId, datetime } = payload;
  const appointmentDate = new Date(datetime);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      datetime: appointmentDate,
      status: { in: ["BOOKED", "CHECKED_IN"] },
    },
  });

  if (conflict) throw new Error("Time slot already booked");

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      datetime: appointmentDate,
      status: "BOOKED",
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const updateAppointment = async (
  appointmentId: string,
  payload: UpdateAppointmentPayload,
  userId: string,
  userRole: string,
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");

  if (userRole === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || existing.patientId !== patient.id) {
      throw new Error("You can only update your own appointments");
    }
  }

  if (payload.datetime) {
    const newDate = new Date(payload.datetime);

    if (
      existing.status !== "CANCELLED" &&
      existing.status !== "BOOKED" &&
      existing.status !== "CHECKED_IN"
    ) {
      throw new Error("Cannot reschedule a completed appointment");
    }

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: existing.doctorId,
        datetime: newDate,
        id: { not: appointmentId },
        status: { in: ["BOOKED", "CHECKED_IN"] },
      },
    });

    if (conflict) throw new Error("New time slot already booked");
  }

  const data: Prisma.AppointmentUpdateInput = {};
  if (payload.datetime) data.datetime = new Date(payload.datetime);
  if (payload.status) data.status = payload.status;

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const overrideAppointment = async (payload: OverridePayload) => {
  const { patientId, doctorId, datetime, reason } = payload;

  if (!reason) throw new Error("Override reason is required");

  const appointmentDate = new Date(datetime);

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      datetime: appointmentDate,
      status: "BOOKED",
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const checkIn = async (appointmentId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.status !== "BOOKED") throw new Error("Only booked appointments can be checked in");

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CHECKED_IN" },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

const checkOut = async (appointmentId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.status !== "CHECKED_IN") throw new Error("Only checked-in appointments can be checked out");

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointment;
};

export const appointmentService = {
  getAppointments,
  createAppointment,
  updateAppointment,
  overrideAppointment,
  checkIn,
  checkOut,
};
