import * as express from 'express';
import { supabaseAdmin } from '../services/supabase';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Get system health status
 * @route GET /api/health
 */
export const getHealthStatus = async (req: express.Request, res: express.Response) => {
  const healthChecks = {
    server: { status: 'ok' },
    supabase: { status: 'unknown' },
    stripe: { status: 'unknown' }
  };

  // Check Supabase connection
  try {
    const { error } = await supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      throw error;
    }
    healthChecks.supabase.status = 'ok';
  } catch (error) {
    logger.error('Supabase health check failed:', error);
    healthChecks.supabase.status = 'error';
  }

  // Check Stripe connection
  try {
    const stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-04-30.basil' as any,
    });
    const balance = await stripe.balance.retrieve();
    if (balance) {
      healthChecks.stripe.status = 'ok';
    }
  } catch (error) {
    logger.error('Stripe health check failed:', error);
    healthChecks.stripe.status = 'error';
  }

  // Return overall status
  const overallStatus = Object.values(healthChecks).some(check => check.status === 'error') ? 500 : 200;
  
  return res.status(overallStatus).json({
    status: overallStatus === 200 ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: healthChecks
  });
};