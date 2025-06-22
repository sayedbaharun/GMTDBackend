import { Request } from 'express';
import { User as PrismaUser } from '@prisma/client';

// Define AuthenticatedRequest that extends Express Request
export interface AuthenticatedRequest extends Request {
  auth?: { // Populated by express-oauth2-jwt-bearer. If (this.auth) is true, all its properties are set.
    payload: {
      sub?: string;         // Subject (Auth0 User ID)
      email?: string;
      name?: string;
      email_verified?: boolean;
      permissions?: string[]; // If using Auth0 RBAC (scopes/permissions)
      // Add other custom claims from your Auth0 token as needed
      [key: string]: any;   // Allow other dynamic/custom claims
    };
    header: any; // Contains token header. Made non-optional as library likely always provides it on valid token.
                 // Typically { alg: 'RS256', typ: 'JWT', kid: '...' }
    token: string; // The raw JWT. Made non-optional as library likely always provides it on valid token.
  };
  user?: PrismaUser; // Populated by our custom syncUserWithDb middleware with local DB user data
}

// Export an empty object to make this file a module
// This prevents the error "Cannot compile namespaces when the '--isolatedModules' flag is provided."
export {};
