export interface AppointmentQuery {
  date?: string;
  doctorId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface EditAppointmentPayload {
  scheduledAt?: string;
  status?: string;
  reason?: string;
}
