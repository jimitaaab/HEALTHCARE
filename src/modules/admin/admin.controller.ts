import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";
import { adminService } from "./admin.service";

const listUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role, search, page, limit } = req.query;
    const result = await adminService.listUsers({
      role: role as any,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users retrieved successfully",
      data: result.users,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  },
);

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = req.params["role"] as string;
    const user = await adminService.createUser(role as any, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully",
      data: { id: user.id, email: user.email },
    });
  },
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = req.params["role"] as string;
    const id = req.params["id"] as string;
    const user = await adminService.updateUser(role as any, id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated successfully",
      data: { id: user.id, email: user.email },
    });
  },
);

const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = req.params["role"] as string;
    const id = req.params["id"] as string;
    await adminService.deleteUser(role as any, id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User deleted successfully",
      data: null,
    });
  },
);

const demographicsAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminService.demographicsAnalytics();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Demographics breakdown",
      data,
    });
  },
);

const diagnosesAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminService.diagnosesAnalytics();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Most common diagnoses",
      data,
    });
  },
);

const appointmentsAnalytics = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminService.appointmentsAnalytics();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Appointment volume trends",
      data,
    });
  },
);

export const adminController = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  demographicsAnalytics,
  diagnosesAnalytics,
  appointmentsAnalytics,
};
