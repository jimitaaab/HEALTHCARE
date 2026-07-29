import { prisma } from "../../lib/prisma";
import { CreateDiagnosisPayload } from "./diagnosis.interface";

const addDiagnosis = async (
  medicalRecordId: string,
  payload: CreateDiagnosisPayload,
  userId: string,
) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new Error("Doctor profile not found");

  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    include: {
      appointment: { select: { doctorId: true } },
    },
  });
  if (!record) throw new Error("Medical record not found");
  if (record.appointment.doctorId !== doctor.id) {
    throw new Error("You can only add diagnoses to your own records");
  }

  const diagnosis = await prisma.diagnosis.create({
    data: {
      medicalRecordId,
      condition: payload.condition,
      code: payload.code,
    },
  });

  return diagnosis;
};

export const diagnosisService = {
  addDiagnosis,
};
