import { Request } from 'express';
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
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export {};
