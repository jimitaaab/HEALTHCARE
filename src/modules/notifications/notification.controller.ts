import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { notificationService } from "./notification.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getMyNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const notifications = await notificationService.getMyNotifications(
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  },
);

const triggerReminderRun = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await notificationService.triggerReminderRun();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reminder run triggered successfully",
      data: result,
    });
  },
);

export const notificationController = {
  getMyNotifications,
  triggerReminderRun,
};
