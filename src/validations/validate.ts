import * as express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    })
      .then(() => {
        next();
      })
      .catch((error) => {
        if (error instanceof ZodError) {
          res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Internal server error during validation',
          });
        }
      });
  };
};
