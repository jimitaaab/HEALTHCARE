import { prisma } from "../../config/prisma";
import { CreatePrescriptionPayload } from "./prescription.types";

const getMyPrescriptions = async (patientId: string) => {
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { id: true, name: true, specialty: true } },
      diagnosis: { select: { condition: true } },
    },
  });

  return prescriptions;
};

const createPrescription = async (payload: CreatePrescriptionPayload, doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new Error("Doctor profile not found");

  const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } });
  if (!patient) throw new Error("Patient not found");

  if (payload.diagnosisId) {
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: payload.diagnosisId },
    });
    if (!diagnosis) throw new Error("Diagnosis not found");
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId: payload.patientId,
      doctorId,
      diagnosisId: payload.diagnosisId ?? null,
      drug: payload.drug,
      dosage: payload.dosage,
      frequency: payload.frequency,
      duration: payload.duration,
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
      diagnosis: { select: { condition: true } },
    },
  });

  return prescription;
};

const requestRefill = async (prescriptionId: string, patientId: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
  });

  if (!prescription) throw new Error("Prescription not found");
  if (prescription.patientId !== patientId) {
    throw new Error("You can only request refills for your own prescriptions");
  }

  return {
    message: "Refill request submitted successfully",
    prescriptionId,
    drug: prescription.drug,
    requestedAt: new Date(),
  };
};

export const prescriptionService = {
  getMyPrescriptions,
  createPrescription,
  requestRefill,
};
