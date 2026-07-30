import { AppointmentStatus } from "../../../generated/prisma/client";

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
}

export interface UpdateAppointmentPayload {
  scheduledAt?: string;
  status?: AppointmentStatus;
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
}

export interface OverridePayload {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  reason: string;
}
