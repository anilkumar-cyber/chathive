import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
    req.body = parsed.body ?? req.body;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      err.errors.forEach((e) => {
        errors[e.path.join(".")] = e.message;
      });
      return next(ApiError.badRequest("Validation failed", errors));
    }
    next(err);
  }
};
