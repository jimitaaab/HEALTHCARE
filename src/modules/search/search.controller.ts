import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { searchService } from "./search.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const searchPatients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query.query as string;
    const patients = await searchService.searchPatients(query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patients found successfully",
      data: patients,
    });
  },
);

const searchAppointments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date, doctorId, status } = req.query;

    const appointments = await searchService.searchAppointments({
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointments found successfully",
      data: appointments,
    });
  },
);

export const searchController = {
  searchPatients,
  searchAppointments,
};
