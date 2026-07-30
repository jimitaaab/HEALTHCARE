export type RoleType = "PATIENT" | "DOCTOR" | "RECEPTIONIST";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  specialty?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  specialty?: string;
}

export interface UserFilters {
  role?: RoleType;
  search?: string;
  page?: number;
  limit?: number;
}
