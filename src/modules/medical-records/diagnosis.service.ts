import { prisma } from "../../config/prisma";
import { CreateDiagnosisPayload } from "./medicalRecord.interface";

const addDiagnosis = async (
  medicalRecordId: string,
  payload: CreateDiagnosisPayload,
  userId: string,
) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
  });
  if (!record) throw new Error("Medical record not found");
  if (record.doctorId !== userId) {
    throw new Error("You can only add diagnoses to your own records");
  }

  const diagnosis = await prisma.diagnosis.create({
    data: {
      recordId: medicalRecordId,
      condition: payload.condition,
      notes: payload.notes,
    },
  });

  return diagnosis;
};

export const diagnosisService = {
  addDiagnosis,
};
