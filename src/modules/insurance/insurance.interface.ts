import { InsuranceClaimStatus } from "../../../generated/prisma/client";

export interface CreateClaimPayload {
  patientId: string;
  appointmentId: string;
}

export interface UpdateClaimStatusPayload {
  status: InsuranceClaimStatus;
}
