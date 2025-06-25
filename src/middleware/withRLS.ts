import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { prismaWithRLS, RLSContext } from '../lib/prisma-with-rls';
import { PrismaClient } from '@prisma/client';

// Extend the request to include RLS-enabled Prisma client
export interface RequestWithRLS extends AuthenticatedRequest {
  prisma: PrismaClient;
  rlsContext: RLSContext;
}

/**
 * Middleware that adds RLS-enabled Prisma client to the request
 * Must be used AFTER authentication middleware
 */
export const withRLS = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const rlsReq = req as RequestWithRLS;

  // Build RLS context from authenticated request
  const context: RLSContext = {
    userId: authReq.userId || authReq.user?.id,
    isAdmin: authReq.user?.isAdmin || false,
    bypassRLS: false, // Default to not bypassing
  };

  // Add RLS context and client to request
  rlsReq.rlsContext = context;
  rlsReq.prisma = prismaWithRLS.withRLS(context);

  next();
};

/**
 * Middleware for admin routes that bypasses RLS
 * Must be used AFTER authentication and admin check
 */
export const withAdminRLS = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const rlsReq = req as RequestWithRLS;

  // Build RLS context with admin bypass
  const context: RLSContext = {
    userId: authReq.userId || authReq.user?.id,
    isAdmin: true,
    bypassRLS: true, // Admin can access all data
  };

  // Add RLS context and client to request
  rlsReq.rlsContext = context;
  rlsReq.prisma = prismaWithRLS.withRLS(context);

  next();
};

/**
 * Helper function to get RLS-enabled Prisma client for a specific user
 * Useful for background jobs or services
 */
export function getPrismaForUser(userId: string, isAdmin: boolean = false): PrismaClient {
  const context: RLSContext = {
    userId,
    isAdmin,
    bypassRLS: isAdmin,
  };

  return prismaWithRLS.withRLS(context);
}

/**
 * Helper function to get Prisma client with RLS bypassed
 * DANGER: Only use for system operations, migrations, or admin tasks
 */
export function getPrismaWithoutRLS(): PrismaClient {
  const context: RLSContext = {
    bypassRLS: true,
  };

  return prismaWithRLS.withRLS(context);
}