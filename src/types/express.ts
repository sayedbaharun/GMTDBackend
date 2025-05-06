import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

// Define the User type based on Prisma schema
type User = {
  id: string;
  email: string;
  password?: string | null;
  fullName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  phone?: string | null;
  companyName?: string | null;
  industry?: string | null;
  companySize?: string | null;
  role?: string | null;
  goals?: string[];
  referralSource?: string | null;
  onboardingStep?: string;
  onboardingComplete?: boolean;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  isAdmin?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date | null;
};

// Define AuthenticatedRequest that extends Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Export an empty object to make this file a module
// This prevents the error "Cannot compile namespaces when the '--isolatedModules' flag is provided."
export {};
