export interface CreatePrescriptionPayload {
  patientId: string;
  diagnosisId?: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface RefillRequestPayload {
  notes?: string;
}
