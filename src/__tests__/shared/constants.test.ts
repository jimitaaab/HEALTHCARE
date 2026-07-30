
import { describe, expect, it } from "@jest/globals";
import {
  Roles,
  AppointmentStatus,
  InsuranceClaimStatus,
} from "../../shared/constants";

describe("Shared Constants", () => {
  describe("Roles", () => {
    it("should have correct role values", () => {
      expect(Roles.ADMIN).toBe("ADMIN");
      expect(Roles.DOCTOR).toBe("DOCTOR");
      expect(Roles.PATIENT).toBe("PATIENT");
      expect(Roles.RECEPTIONIST).toBe("RECEPTIONIST");
    });
  });

  describe("AppointmentStatus", () => {
    it("should have correct appointment statuses", () => {
      expect(AppointmentStatus.BOOKED).toBe("BOOKED");
      expect(AppointmentStatus.CHECKED_IN).toBe("CHECKED_IN");
      expect(AppointmentStatus.COMPLETED).toBe("COMPLETED");
      expect(AppointmentStatus.CANCELLED).toBe("CANCELLED");
    });
  });

  describe("InsuranceClaimStatus", () => {
    it("should have correct insurance claim statuses", () => {
      expect(InsuranceClaimStatus.SUBMITTED).toBe("SUBMITTED");
      expect(InsuranceClaimStatus.IN_REVIEW).toBe("IN_REVIEW");
      expect(InsuranceClaimStatus.APPROVED).toBe("APPROVED");
      expect(InsuranceClaimStatus.REJECTED).toBe("REJECTED");
    });
  });
});