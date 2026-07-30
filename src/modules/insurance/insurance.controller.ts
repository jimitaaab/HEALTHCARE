import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { insuranceService } from "./insurance.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const createClaim = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claim = await insuranceService.createClaim(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Insurance claim submitted successfully",
      data: claim,
    });
  },
);

const updateClaimStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const claim = await insuranceService.updateClaimStatus(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Claim status updated successfully",
      data: claim,
    });
  },
);

const getAllClaims = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claims = await insuranceService.getAllClaims();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Claims retrieved successfully",
      data: claims,
    });
  },
);

const getMyClaims = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claims = await insuranceService.getMyClaims(req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Claims retrieved successfully",
      data: claims,
    });
  },
);

export const insuranceController = {
  createClaim,
  updateClaimStatus,
  getAllClaims,
  getMyClaims,
};
