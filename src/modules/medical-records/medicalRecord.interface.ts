export interface CreateMedicalRecordPayload {
  notes: string;
}

export interface CreateDiagnosisPayload {
  condition: string;
  notes?: string;
}
