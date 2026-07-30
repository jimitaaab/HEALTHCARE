import { prisma } from "../../lib/prisma";
import { CreateMedicalRecordPayload } from "./medicalRecord.interface";

const getPatientHistory = async (
  patientId: string,
  userId: string,
  userRole: string,
) => {
  if (userRole === "PATIENT" && patientId !== userId) {
    throw new Error("You can only view your own history");
  }

  if (userRole === "DOCTOR") {
    const hasAppointment = await prisma.appointment.findFirst({
      where: { patientId, doctorId: userId },
    });
    if (!hasAppointment) throw new Error("You can only view your assigned patients");
  }

  const [appointments, medicalRecords, prescriptions] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: "desc" },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { id: true, name: true } },
        diagnoses: true,
      },
    }),
    prisma.prescription.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { id: true, name: true } },
        diagnosis: { select: { condition: true } },
      },
    }),
  ]);

  return { appointments, medicalRecords, prescriptions };
};

const createMedicalRecord = async (
  patientId: string,
  payload: CreateMedicalRecordPayload,
  userId: string,
) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: userId } });
  if (!doctor) throw new Error("Doctor profile not found");

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      doctorId: userId,
      notes: payload.notes,
    },
  });

  return record;
};

export const medicalRecordService = {
  getPatientHistory,
  createMedicalRecord,
};
