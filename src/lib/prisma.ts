import { PrismaClient } from '@prisma/client';
import { prismaWithRLS, PrismaClientWithRLS } from './prisma-with-rls';

// For backwards compatibility, export the base Prisma client
// This will be gradually replaced with RLS-enabled versions
export const prisma = prismaWithRLS;

// Export the RLS-enabled client as well
export const prismaRLS = prismaWithRLS;

// Re-export types
export type { RLSContext } from './prisma-with-rls';