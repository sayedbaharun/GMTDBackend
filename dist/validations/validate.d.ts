import * as express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import { AnyZodObject } from 'zod';
export declare const validate: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => void;
export {};
