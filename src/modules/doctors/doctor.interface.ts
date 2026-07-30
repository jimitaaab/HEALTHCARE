export interface DoctorFilters {
  search?: string;
  specialty?: string;
  page?: number;
  limit?: number;
}

export interface UpdateDoctorPayload {
  name?: string;
  gender?: string;
  specialty?: string;
}

export interface ScheduleQuery {
  date?: string;
}
