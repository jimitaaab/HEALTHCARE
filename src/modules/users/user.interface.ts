import { Role } from "../../../generated/prisma/client";

export interface CreateUserPayload {
  email: string;
  password: string;
  role: Role;
  name?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  contactInfo?: string;
  specialty?: string;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
