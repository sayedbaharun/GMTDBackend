import * as express from 'express';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import os from 'os';

/**
 * Get system health status
 * @route GET /api/health
 */
export const getHealthStatus = async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  
  const healthChecks = {
    server: { 
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    database: { status: 'unknown', responseTime: 0 },
    stripe: { status: 'unknown', responseTime: 0 },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus().length
    }
  };

  // Check database connection with Prisma
  if (config.enableDatabase !== false) {
    const prisma = new PrismaClient();
    const dbStartTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database.status = 'ok';
      healthChecks.database.responseTime = Date.now() - dbStartTime;
    } catch (error) {
      logger.error('Database health check failed:', error);
      healthChecks.database.status = 'error';
      healthChecks.database.responseTime = Date.now() - dbStartTime;
    } finally {
      await prisma.$disconnect();
    }
  } else {
    healthChecks.database.status = 'disabled';
  }

  // Check Stripe connection
  if (config.stripe?.secretKey) {
    const stripeStartTime = Date.now();
    try {
      const stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-04-30.basil' as any,
      });
      const balance = await stripe.balance.retrieve();
      if (balance) {
        healthChecks.stripe.status = 'ok';
        healthChecks.stripe.responseTime = Date.now() - stripeStartTime;
      }
    } catch (error) {
      logger.error('Stripe health check failed:', error);
      healthChecks.stripe.status = 'error';
      healthChecks.stripe.responseTime = Date.now() - stripeStartTime;
    }
  } else {
    healthChecks.stripe.status = 'disabled';
  }

  // Return overall status
  const hasErrors = Object.values(healthChecks).some(check => 
    typeof check === 'object' && 'status' in check && check.status === 'error'
  );
  const overallStatus = hasErrors ? 500 : 200;
  
  return res.status(overallStatus).json({
    status: overallStatus === 200 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0',
    checks: healthChecks
  });
};

/**
 * Simple readiness probe
 * @route GET /api/health/ready
 */
export const getReadinessStatus = async (req: express.Request, res: express.Response) => {
  try {
    // Quick check that server can respond to requests
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Simple liveness probe
 * @route GET /api/health/live
 */
export const getLivenessStatus = async (req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    status: 'alive', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
};