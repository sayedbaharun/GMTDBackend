import * as express from 'express';
import { AuthenticatedRequest } from '../types/express';
export declare const getUserBookings: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const getBookingById: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const createBooking: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
export declare const cancelBooking: (req: AuthenticatedRequest, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
