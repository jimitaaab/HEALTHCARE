import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { medicalRecordService } from "./medicalRecord.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getPatientHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const patientId = req.params.id as string;
    const history = await medicalRecordService.getPatientHistory(
      patientId,
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient history retrieved successfully",
      data: history,
    });
  },
);

const createMedicalRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const patientId = req.params.id as string;
    const record = await medicalRecordService.createMedicalRecord(
      patientId,
      req.body,
      req.user!.id,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Medical record created successfully",
      data: record,
    });
  },
);

export const medicalRecordController = {
  getPatientHistory,
  createMedicalRecord,
};
