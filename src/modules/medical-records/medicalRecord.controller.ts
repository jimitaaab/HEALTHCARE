import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { medicalRecordService } from "./medicalRecord.service";
import { diagnosisService } from "./diagnosis.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getMyHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const history = await medicalRecordService.getPatientHistory(
      req.user!.id,
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Medical history retrieved successfully",
      data: history,
    });
  },
);

const getPatientHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const patientId = req.params.patientId as string;
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
    const patientId = req.params.patientId as string;
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

const addDiagnosis = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const recordId = req.params.recordId as string;
    const diagnosis = await diagnosisService.addDiagnosis(
      recordId,
      req.body,
      req.user!.id,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Diagnosis added successfully",
      data: diagnosis,
    });
  },
);

export const medicalRecordController = {
  getMyHistory,
  getPatientHistory,
  createMedicalRecord,
  addDiagnosis,
};
