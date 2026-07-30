import { prisma } from "../../config/prisma";
import { CreateClaimPayload, UpdateClaimStatusPayload } from "./insurance.interface";

const createClaim = async (payload: CreateClaimPayload) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
  });
  if (!appointment) throw new Error("Appointment not found");

  const existing = await prisma.insuranceClaim.findUnique({
    where: { appointmentId: payload.appointmentId },
  });
  if (existing) throw new Error("A claim for this appointment already exists");

  const claim = await prisma.insuranceClaim.create({
    data: {
      patientId: payload.patientId,
      appointmentId: payload.appointmentId,
      status: "SUBMITTED",
    },
    include: {
      patient: { select: { id: true, name: true } },
      appointment: { select: { id: true, scheduledAt: true } },
    },
  });

  return claim;
};

const updateClaimStatus = async (claimId: string, payload: UpdateClaimStatusPayload) => {
  const existing = await prisma.insuranceClaim.findUnique({
    where: { id: claimId },
  });
  if (!existing) throw new Error("Claim not found");

  const claim = await prisma.insuranceClaim.update({
    where: { id: claimId },
    data: { status: payload.status },
    include: {
      patient: { select: { id: true, name: true } },
      appointment: { select: { id: true, scheduledAt: true } },
    },
  });

  return claim;
};

const getAllClaims = async () => {
  const claims = await prisma.insuranceClaim.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      patient: { select: { id: true, name: true } },
      appointment: { select: { id: true, scheduledAt: true } },
    },
  });

  return claims;
};

const getMyClaims = async (patientId: string) => {
  const claims = await prisma.insuranceClaim.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      appointment: { select: { id: true, scheduledAt: true } },
    },
  });

  return claims;
};

export const insuranceService = {
  createClaim,
  updateClaimStatus,
  getAllClaims,
  getMyClaims,
};
