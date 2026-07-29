import { prisma } from "../../lib/prisma";
import { CreateMedicalRecordPayload } from "./medicalRecord.interface";

const getPatientHistory = async (
  patientId: string,
  userId: string,
  userRole: string,
) => {
  if (userRole === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== patientId) {
      throw new Error("You can only view your own history");
    }
  }

  if (userRole === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new Error("Doctor profile not found");
    const hasAppointment = await prisma.appointment.findFirst({
      where: { patientId, doctorId: doctor.id },
    });
    if (!hasAppointment) throw new Error("You can only view your assigned patients");
  }

  const [appointments, medicalRecords, prescriptions] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      orderBy: { datetime: "desc" },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: { select: { datetime: true } },
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
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error("Doctor profile not found");

  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
  });
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.patientId !== patientId) {
    throw new Error("Appointment does not belong to this patient");
  }
  if (appointment.doctorId !== doctor.id) {
    throw new Error("You can only create records for your own appointments");
  }
  if (appointment.status !== "COMPLETED") {
    throw new Error("Can only create records for completed visits");
  }

  const existing = await prisma.medicalRecord.findUnique({
    where: { appointmentId: payload.appointmentId },
  });
  if (existing) throw new Error("Medical record already exists for this appointment");

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      appointmentId: payload.appointmentId,
      clinicalNotes: payload.clinicalNotes,
    },
    include: {
      appointment: { select: { datetime: true } },
    },
  });

  return record;
};

export const medicalRecordService = {
  getPatientHistory,
  createMedicalRecord,
};
