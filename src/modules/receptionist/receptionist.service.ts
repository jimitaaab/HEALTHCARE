import { prisma } from "../../config/prisma";
import { AppointmentStatus } from "../../../generated/prisma/client";
import { AppointmentQuery, EditAppointmentPayload } from "./receptionist.types";

const getAppointments = async (query: AppointmentQuery) => {
  const { date, doctorId, status, page = 1, limit = 50 } = query;
  const where: Record<string, any> = {};

  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: startDate, lte: endDate };
  }

  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "asc" },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page, limit };
};

const editAppointment = async (appointmentId: string, payload: EditAppointmentPayload) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!existing) throw new Error("Appointment not found");

  const data: Record<string, any> = {};
  if (payload.scheduledAt) data.scheduledAt = new Date(payload.scheduledAt);
  if (payload.status) data.status = payload.status as AppointmentStatus;

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
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
      doctor: { select: { id: true, name: true } },
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
      doctor: { select: { id: true, name: true } },
    },
  });

  return appointment;
};

export const receptionistService = {
  getAppointments,
  editAppointment,
  checkIn,
  checkOut,
};
