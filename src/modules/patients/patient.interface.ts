export interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdatePatientPayload {
  phone?: string;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface PatientSearchQuery {
  name?: string;
  condition?: string;
  medication?: string;
}

export interface BookAppointmentPayload {
  doctorId: string;
  scheduledAt: string;
}

export interface RescheduleAppointmentPayload {
  scheduledAt: string;
}
