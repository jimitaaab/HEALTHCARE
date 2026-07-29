import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";

export type ValidationSchema = {
  [key: string]: (value: any) => string | null;
};

const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(schema)) {
      const error = validator(req.body[field]);
      if (error) {
        errors[field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        statusCode: httpStatus.UNPROCESSABLE_ENTITY,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

export default validate;
