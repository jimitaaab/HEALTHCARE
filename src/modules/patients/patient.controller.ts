import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { patientService } from "./patient.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const getAllPatients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, page, limit } = req.query;

    const result = await patientService.getAllPatients({
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patients retrieved successfully",
      data: result.patients,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  },
);

const getPatientById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const patient = await patientService.getPatientById(
      id,
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient retrieved successfully",
      data: patient,
    });
  },
);

const updatePatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const patient = await patientService.updatePatient(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient updated successfully",
      data: patient,
    });
  },
);

const searchPatients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, condition, medication } = req.query;

    const patients = await patientService.searchPatients(
      { name: name as string, condition: condition as string, medication: medication as string },
      req.user!.id,
      req.user!.role,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patients found successfully",
      data: patients,
    });
  },
);

export const patientController = {
  getAllPatients,
  getPatientById,
  updatePatient,
  searchPatients,
};
