export const Roles = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  PATIENT: "PATIENT",
  RECEPTIONIST: "RECEPTIONIST",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const AppointmentStatus = {
  BOOKED: "BOOKED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const InsuranceClaimStatus = {
  SUBMITTED: "SUBMITTED",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type InsuranceClaimStatus = (typeof InsuranceClaimStatus)[keyof typeof InsuranceClaimStatus];
