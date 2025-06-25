import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { 
  AuthenticationRequiredError, 
  wrapPrismaError 
} from '../utils/rls-errors';

// Context type for RLS
export interface RLSContext {
  userId?: string;
  isAdmin?: boolean;
  bypassRLS?: boolean;
}

// Extended Prisma Client type with context
export type PrismaClientWithRLS = PrismaClient & {
  withRLS: (context: RLSContext) => PrismaClient;
};

// List of models that should be protected by RLS
const RLS_PROTECTED_MODELS = [
  'User',
  'Profile',
  'Booking',
  'BookingFlight',
  'BookingHotel',
  'ConciergeRequest',
  'Conversation',
  'ConversationParticipant',
  'Message',
  'TravelRequest',
  'UserPreferences',
  'ConversationMemory',
  'UserBehaviorAnalytics',
  'PaymentTransaction',
  'BookingAuditLog',
  'ComplianceRecord',
] as const;

// Models that have userId field at root level
const USER_ID_MODELS = [
  'User',
  'Profile',
  'Booking',
  'TravelRequest',
  'UserPreferences',
  'UserBehaviorAnalytics',
  'BookingConfirmation',
  'PaymentTransaction',
] as const;

// Models that have userId through relations
const RELATION_MODELS = {
  BookingFlight: { relation: 'booking', field: 'userId' },
  BookingHotel: { relation: 'booking', field: 'userId' },
  ConciergeRequest: { relation: 'booking', field: 'userId' },
  Message: { relation: 'sender', field: 'id' },
  ConversationParticipant: { relation: 'user', field: 'id' },
  ConversationMemory: { relation: 'user', field: 'id' },
  BookingAuditLog: { relation: 'performedBy', field: 'id' },
  ComplianceRecord: { relation: 'booking', field: 'userId' },
} as const;

/**
 * Creates RLS middleware for Prisma
 * @param context - The RLS context containing userId and permissions
 */
function createRLSMiddleware(context: RLSContext): Prisma.Middleware {
  return async (params, next) => {
    const { model, action, args } = params;

    // Skip RLS for admin users with bypass flag or if no model
    if (context.bypassRLS || context.isAdmin || !model) {
      return next(params);
    }

    // Check if this model should be protected
    if (!RLS_PROTECTED_MODELS.includes(model as any)) {
      return next(params);
    }

    // Skip RLS if no userId in context
    if (!context.userId) {
      logger.warn(`RLS: No userId in context for ${model}.${action}`);
      throw new AuthenticationRequiredError(model, action);
    }

    // Handle different actions
    if (['findFirst', 'findUnique', 'findMany', 'count', 'aggregate', 'groupBy'].includes(action)) {
      // For read operations, add userId filter
      params.args = addUserIdFilter(params.args, model, context.userId);
    } else if (['create', 'createMany'].includes(action)) {
      // For create operations, ensure userId is set
      params.args = ensureUserIdInCreate(params.args, model, context.userId);
    } else if (['update', 'updateMany', 'delete', 'deleteMany'].includes(action)) {
      // For update/delete operations, add userId to where clause
      params.args = addUserIdFilter(params.args, model, context.userId);
    } else if (action === 'upsert') {
      // For upsert, handle both create and update
      params.args = {
        ...params.args,
        create: ensureUserIdInData(params.args.create, model, context.userId),
        update: params.args.update,
        where: addUserIdToWhere(params.args.where, model, context.userId),
      };
    }

    try {
      const result = await next(params);
      return result;
    } catch (error) {
      logger.error(`RLS Error in ${model}.${action}:`, error);
      throw wrapPrismaError(error, model, action);
    }
  };
}

/**
 * Adds userId filter to query arguments
 */
function addUserIdFilter(args: any, model: string, userId: string): any {
  if (!args) args = {};

  // For models with direct userId field
  if (USER_ID_MODELS.includes(model as any)) {
    if (model === 'User') {
      // Special case for User model - filter by id instead of userId
      args.where = { ...args.where, id: userId };
    } else {
      args.where = { ...args.where, userId };
    }
    return args;
  }

  // For models with userId through relations
  const relationConfig = RELATION_MODELS[model as keyof typeof RELATION_MODELS];
  if (relationConfig) {
    args.where = {
      ...args.where,
      [relationConfig.relation]: {
        [relationConfig.field]: userId,
      },
    };
  }

  return args;
}

/**
 * Ensures userId is set in create data
 */
function ensureUserIdInCreate(args: any, model: string, userId: string): any {
  if (!args) args = {};

  if (args.data) {
    if (Array.isArray(args.data)) {
      // For createMany with array data
      args.data = args.data.map((item: any) => ensureUserIdInData(item, model, userId));
    } else {
      // For single create
      args.data = ensureUserIdInData(args.data, model, userId);
    }
  }

  return args;
}

/**
 * Ensures userId is present in data object
 */
function ensureUserIdInData(data: any, model: string, userId: string): any {
  if (!data) return data;

  // For models with direct userId field
  if (USER_ID_MODELS.includes(model as any) && model !== 'User') {
    return { ...data, userId };
  }

  // For User model, we don't add userId
  if (model === 'User') {
    return data;
  }

  // For relation models, ensure proper relation is set
  const relationConfig = RELATION_MODELS[model as keyof typeof RELATION_MODELS];
  if (relationConfig && relationConfig.relation !== 'sender' && relationConfig.relation !== 'user') {
    // Don't override existing relations, just ensure they point to the right user
    return data;
  }

  return data;
}

/**
 * Adds userId constraint to where clause
 */
function addUserIdToWhere(where: any, model: string, userId: string): any {
  if (!where) where = {};

  // For models with direct userId field
  if (USER_ID_MODELS.includes(model as any)) {
    if (model === 'User') {
      return { ...where, id: userId };
    } else {
      return { ...where, userId };
    }
  }

  // For relation models
  const relationConfig = RELATION_MODELS[model as keyof typeof RELATION_MODELS];
  if (relationConfig) {
    return {
      ...where,
      [relationConfig.relation]: {
        [relationConfig.field]: userId,
      },
    };
  }

  return where;
}

/**
 * Creates a Prisma client with RLS capabilities
 */
export function createPrismaClientWithRLS(): PrismaClientWithRLS {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Add the withRLS method
  (prisma as any).withRLS = function(context: RLSContext) {
    // Create a new client instance with the RLS middleware
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    // Apply RLS middleware
    client.$use(createRLSMiddleware(context));

    return client;
  };

  return prisma as PrismaClientWithRLS;
}

// Create a singleton instance
export const prismaWithRLS = createPrismaClientWithRLS();