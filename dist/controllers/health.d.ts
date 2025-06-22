import * as express from 'express';
/**
 * Get system health status
 * @route GET /api/health
 */
export declare const getHealthStatus: (req: express.Request, res: express.Response) => Promise<express.Response<any, Record<string, any>>>;
/**
 * Simple readiness probe
 * @route GET /api/health/ready
 */
export declare const getReadinessStatus: (req: express.Request, res: express.Response) => Promise<void>;
/**
 * Simple liveness probe
 * @route GET /api/health/live
 */
export declare const getLivenessStatus: (req: express.Request, res: express.Response) => Promise<void>;
