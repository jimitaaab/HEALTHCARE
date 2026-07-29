export interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdatePatientPayload {
  contactInfo?: string;
  demographics?: Record<string, any>;
  name?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dob?: string;
}

export interface PatientSearchQuery {
  name?: string;
  condition?: string;
  medication?: string;
}
