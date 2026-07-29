export interface DoctorFilters {
  search?: string;
  specialty?: string;
  page?: number;
  limit?: number;
}

export interface AvailabilityQuery {
  date: string;
}
