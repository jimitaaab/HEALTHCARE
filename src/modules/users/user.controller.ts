import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { userService } from "./user.service";
import catchAsync from "../../shared/utils/asyncHandler";
import sendResponse from "../../shared/utils/apiResponse";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully",
      data: { id: user.id, email: user.email, role: user.role },
    });
  },
);

const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, role, isActive, page, limit } = req.query;

    const result = await userService.getUsers({
      search: search as string,
      role: role as any,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users retrieved successfully",
      data: result.users,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  },
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const user = await userService.updateUser(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated successfully",
      data: { id: user.id, email: user.email, role: user.role, isActive: user.isActive },
    });
  },
);

export const userController = {
  createUser,
  getUsers,
  updateUser,
};
