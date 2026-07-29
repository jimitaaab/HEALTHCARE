import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { appointmentService } from "./appointment.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date, doctorId, status, page, limit } = req.query;

    const result = await appointmentService.getAppointments(
      {
        date: date as string,
        doctorId: doctorId as string,
        status: status as any,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      req.user!.id,
      req.user!.role,
    );

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

const createAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const appointment = await appointmentService.createAppointment(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Appointment booked successfully",
      data: appointment,
    });
  },
);

const updateAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const appointment = await appointmentService.updateAppointment(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointment updated successfully",
      data: appointment,
    });
  },
);

const overrideAppointment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const appointment = await appointmentService.overrideAppointment(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Appointment overridden successfully",
      data: appointment,
    });
  },
);

const checkIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const appointment = await appointmentService.checkIn(id);

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
    const appointment = await appointmentService.checkOut(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient checked out successfully",
      data: appointment,
    });
  },
);

export const appointmentController = {
  getAppointments,
  createAppointment,
  updateAppointment,
  overrideAppointment,
  checkIn,
  checkOut,
};
