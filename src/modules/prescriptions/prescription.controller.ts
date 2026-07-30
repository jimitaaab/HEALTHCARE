import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { prescriptionService } from "./prescription.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getMyPrescriptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const prescriptions = await prescriptionService.getMyPrescriptions(req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Prescriptions retrieved successfully",
      data: prescriptions,
    });
  },
);

const createPrescription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const prescription = await prescriptionService.createPrescription(req.body, req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Prescription created successfully",
      data: prescription,
    });
  },
);

const requestRefill = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await prescriptionService.requestRefill(id, req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Refill requested successfully",
      data: result,
    });
  },
);

export const prescriptionController = {
  getMyPrescriptions,
  createPrescription,
  requestRefill,
};
