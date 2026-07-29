import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { diagnosisService } from "./diagnosis.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const addDiagnosis = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const recordId = req.params.id as string;
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

export const diagnosisController = {
  addDiagnosis,
};
