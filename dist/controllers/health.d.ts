import * as express from 'express';
/**
 * Get system health status
 * @route GET /api/health
 */
export declare const getHealthStatus: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
