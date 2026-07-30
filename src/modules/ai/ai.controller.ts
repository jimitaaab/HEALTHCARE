import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { aiService } from "./ai.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const symptomCheck = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: "Symptoms description is required",
      });
      return;
    }

    const result = await aiService.symptomCheck(symptoms);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Symptom analysis complete",
      data: result,
    });
  },
);

export const aiController = {
  symptomCheck,
};
