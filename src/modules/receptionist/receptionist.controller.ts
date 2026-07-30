import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { receptionistService } from "./receptionist.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date, doctorId, status, page, limit } = req.query;

    const result = await receptionistService.getAppointments({
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointments retrieved successfully",
      data: result.appointments,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  },
);

const editAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const appointment = await receptionistService.editAppointment(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointment updated successfully",
      data: appointment,
    });
  },
);

const checkIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const appointment = await receptionistService.checkIn(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient checked in successfully",
      data: appointment,
    });
  },
);

const checkOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const appointment = await receptionistService.checkOut(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient checked out successfully",
      data: appointment,
    });
  },
);

export const receptionistController = {
  getAppointments,
  editAppointment,
  checkIn,
  checkOut,
};
