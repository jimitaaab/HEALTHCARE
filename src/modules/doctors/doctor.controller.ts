import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { doctorService } from "./doctor.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getAllDoctors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, specialty, page, limit } = req.query;

    const result = await doctorService.getAllDoctors({
      search: search as string,
      specialty: specialty as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctors retrieved successfully",
      data: result.doctors,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  },
);

const getDoctorById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const doctor = await doctorService.getDoctorById(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor retrieved successfully",
      data: doctor,
    });
  },
);

const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doctor = await doctorService.getMyProfile(req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile retrieved successfully",
      data: doctor,
    });
  },
);

const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doctor = await doctorService.updateMyProfile(req.user!.id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully",
      data: doctor,
    });
  },
);

const getMySchedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.query;
    const result = await doctorService.getMySchedule(req.user!.id, {
      date: date as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Schedule retrieved successfully",
      data: result,
    });
  },
);

const getMyAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const appointments = await doctorService.getMyAppointments(req.user!.id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointments retrieved successfully",
      data: appointments,
    });
  },
);

export const doctorController = {
  getAllDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getMySchedule,
  getMyAppointments,
};
