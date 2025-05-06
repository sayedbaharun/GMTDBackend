import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
export declare const getAllFlights: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const getFlightById: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const createFlight: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const updateFlight: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const deleteFlight: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
