import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).send({ error: error.details[0].message });
      return;
    }
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return next(
        new ApiError(error.details[0].message, HttpStatus.BAD_REQUEST)
      );
    }
    next();
  };
};
