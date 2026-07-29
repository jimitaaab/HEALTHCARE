import { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status-codes";

const catchAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(error);

      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Failed to register user",
        error: (error as Error).message,
      });
    }
  };
};

export default catchAsync;
