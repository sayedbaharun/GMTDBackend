import { Response, NextFunction } from 'express';
import { auth as jwtAuth, claimCheck } from 'express-oauth2-jwt-bearer';
import { AuthenticatedRequest } from '../types/express'; // Path might need review
import { User as PrismaUser } from '@prisma/client';
import { ApiError } from '../types';
import { authService } from '../services/auth'; // CORRECTED IMPORT PATH
import { logger } from '../utils/logger';

// 1. Core Authentication Middleware (Validates Auth0 Access Token)
// This middleware checks for a valid JWT Access Token and populates req.auth.
// It should be configured with your Auth0 domain and API identifier (audience).
export const validateAccessToken = process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE
  ? jwtAuth({
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_AUDIENCE,
      // tokenSigningAlg: 'RS256' // Algorithm is usually RS256 for Auth0
    })
  : (req: any, res: Response, next: NextFunction) => {
      logger.warn('Auth0 not configured - bypassing authentication');
      next();
    };

// 2. User Synchronization Middleware (Gets/Creates local user from DB)
// Runs *after* validateAccessToken.
// Takes Auth0 user ID (sub) from req.auth.payload and ensures user exists in local DB.
// Populates req.user with the PrismaUser object.
export const syncUserWithDb = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.auth?.payload?.sub) {
    // This should ideally not happen if validateAccessToken ran successfully
    logger.warn('Auth0 sub missing from req.auth.payload after token validation.');
    // If validateAccessToken is properly configured and runs first, it would throw an error before reaching here if sub is missing.
    // However, if this middleware is somehow called standalone or req.auth is unexpectedly malformed:
    return next(new ApiError('User identifier missing from token.', 401)); // Changed to 401 as it implies an auth issue
  }

  const auth0UserId = req.auth.payload.sub as string;
  const email = req.auth.payload.email as string | undefined; // Auth0 email claim
  const name = req.auth.payload.name as string | undefined; // Auth0 name claim
  const emailVerified = req.auth.payload.email_verified as boolean | undefined; // Auth0 email_verified claim

  try {
    const serviceResponse = await authService.getOrCreateUserFromAuth0({
      sub: auth0UserId,
      email: email,
      name: name,
      email_verified: emailVerified,
      // Add any other relevant claims from req.auth.payload that your service expects
    });

    if (!serviceResponse.success || !serviceResponse.data) {
      logger.error('Failed to get or create user from DB:', serviceResponse.error);
      return next(new ApiError(serviceResponse.error || 'Could not process user information.', serviceResponse.statusCode || 500));
    }

    req.user = serviceResponse.data; // Attach Prisma user to req.user
    next();
  } catch (error: any) {
    logger.error('Error in syncUserWithDb middleware:', error);
    next(new ApiError('Server error during user synchronization.', 500));
  }
};

// 3. Combined Authentication and User Sync Middleware
// This is what most protected routes will use.
export const authenticateAndSyncUser = [validateAccessToken, syncUserWithDb];


// 4. Optional Authentication Middleware
// For routes that can be accessed by anyone, but might behave differently if a user is logged in.
// This setup attempts to validate a token if present, and sync the user.
// If no token, or if it's invalid, it proceeds without req.auth or req.user.
export const authenticateOptional = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  validateAccessToken(req, res, (err) => {
    if (err) {
      // An error occurred during token validation (e.g., token missing, invalid, expired).
      // For optional authentication, we log this but allow the request to proceed as anonymous.
      logger.warn(`Optional auth: Token validation failed or token not provided (proceeding as anonymous): ${err.message}`);
      // Ensure req.auth and req.user are not partially populated or in an inconsistent state.
      delete req.auth;
      delete req.user;
      return next(); // Proceed to the next middleware/route handler without authenticated user context.
    }

    // If err is not set, validateAccessToken successfully processed the token (if one was provided and was valid).
    // If no token was provided, validateAccessToken (depending on its internal config, which expects a token by default)
    // might have called next(err) already, or it might call next() if it were configurable to allow no token.
    // Given validateAccessToken is strict, an error (e.g. 'Unauthorized') would occur if no token is present.
    // The above `if (err)` block handles this by calling `next()`.

    // If we reach here, it means a token was provided and it was successfully validated by validateAccessToken.
    // So, req.auth is populated. Now, attempt to sync the user.
    if (req.auth?.payload?.sub) {
      syncUserWithDb(req, res, next).catch(next); // syncUserWithDb will call next() or next(err)
    } else {
      // This case (token validated but no sub) should be rare with Auth0 but is a safeguard.
      // Or, if validateAccessToken somehow succeeded without a token (not its default behavior).
      logger.warn('Optional auth: Token validated but no user identifier (sub) found in payload. Proceeding as anonymous.');
      next();
    }
  });
};


// 5. Middleware to check if onboarding is complete
export const requireOnboardingComplete = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // This middleware must run *after* authenticateAndSyncUser or an equivalent that populates req.user
  if (!req.user) {
    // If req.user is not populated, it means authentication/sync failed or wasn't run
    return next(new ApiError('Authentication required to check onboarding status.', 401));
  }

  const user = req.user as PrismaUser; // req.user is now PrismaUser from syncUserWithDb
  if (!user.onboardingComplete) {
    return next(new ApiError('Onboarding not completed. Please complete your profile.', 403));
  }
  next();
};

// 6. Middleware to check for Admin role
export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // This middleware must run *after* authenticateAndSyncUser or an equivalent that populates req.user
  if (!req.user) {
    return next(new ApiError('Authentication required for admin access.', 401));
  }

  const user = req.user as PrismaUser; // req.user is now PrismaUser
  if (!user.isAdmin) {
    return next(new ApiError('Forbidden: Admin access required.', 403));
  }
  next();
};

// 7. Bypass Authentication for Development (To be reviewed/removed for production)
// This needs to mock req.auth and req.user based on the new structure.
// For now, let's assume it's for very specific dev scenarios and might be removed.
/*
export const bypassAuthForDevelopment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Mock req.auth (payload from a sample Auth0 token)
  req.auth = {
    payload: {
      sub: 'dev-admin|xxxxxxxxxxxxxxx', // Mock Auth0 user ID
      email: 'dev-admin@example.com',
      name: 'Dev Admin',
      permissions: ['read:all', 'write:all'], // Example permissions
      // Ensure all claims used by syncUserWithDb are present
      email_verified: true,
    },
    header: {}, // Mocked
    token: 'mock.token.value' // Mocked
  };

  // Then run syncUserWithDb to populate req.user
  // This assumes syncUserWithDb can handle a mocked req.auth
  // Or, directly mock req.user with necessary Prisma User fields:
  // req.user = {
  //   id: 'clxxxxxxxxx', // mock DB ID
  //   auth0Id: 'dev-admin|xxxxxxxxxxxxxxx',
  //   email: 'dev-admin@example.com',
  //   fullName: 'Dev Admin',
  //   isAdmin: true,
  //   onboardingComplete: true,
  //   // ... other necessary Prisma User fields
  // } as PrismaUser;

  // If directly mocking req.user, you can just call next().
  // If using syncUserWithDb with mocked req.auth, then:
  await syncUserWithDb(req, res, next);

  // logger.warn('Development: Bypassing Auth0 authentication with mock admin user.');
  // next();
};
*/

// Note: The original `bypassAdminAuth` directly set `req.user` and `req.isAuthenticated`.
// The new structure requires mocking `req.auth` if `syncUserWithDb` is to be used,
// or directly mocking the full `req.user` (Prisma type) if `syncUserWithDb` is bypassed.
// For true end-to-end testing of the Auth0 flow, this bypass should be avoided or used very carefully.

// Ensure AuthenticatedRequest in ../types/express.ts is updated:
// export interface AuthenticatedRequest extends Request {
//   auth?: { // Populated by express-oauth2-jwt-bearer
//     payload: {
//       sub?: string;
//       email?: string;
//       name?: string;
//       email_verified?: boolean;
//       permissions?: string[]; // If using Auth0 RBAC
//       [key: string]: any; // Allow other custom claims
//     };
//     header?: any;
//     token?: string;
//   };
//   user?: PrismaUser; // Populated by syncUserWithDb middleware
// }

// Also, ensure your .env file has AUTH0_DOMAIN and AUTH0_AUDIENCE set correctly.
// Example .env.example:
// AUTH0_DOMAIN="your-tenant.auth0.com"
// AUTH0_AUDIENCE="your-api-identifier"
// You'll get these from your Auth0 Application and API settings.
