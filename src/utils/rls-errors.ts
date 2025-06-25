/**
 * Custom error classes for RLS-related errors
 */

export class RLSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RLSError';
  }
}

export class UnauthorizedAccessError extends RLSError {
  constructor(resource: string, action: string) {
    super(
      `Unauthorized access: You do not have permission to ${action} this ${resource}`,
      'UNAUTHORIZED_ACCESS'
    );
  }
}

export class AuthenticationRequiredError extends RLSError {
  constructor(resource: string, action: string) {
    super(
      `Authentication required for ${resource} ${action}. Please ensure you are logged in.`,
      'AUTHENTICATION_REQUIRED'
    );
  }
}

export class ResourceNotFoundError extends RLSError {
  constructor(resource: string) {
    super(
      `${resource} not found or you do not have permission to access it`,
      'RESOURCE_NOT_FOUND'
    );
  }
}

export class InvalidUserContextError extends RLSError {
  constructor() {
    super(
      'Invalid user context: Unable to determine user identity',
      'INVALID_USER_CONTEXT'
    );
  }
}

/**
 * Helper function to wrap Prisma errors with RLS-aware messages
 */
export function wrapPrismaError(error: any, model: string, action: string): Error {
  // Check if it's a Prisma "Record not found" error
  if (error.code === 'P2025') {
    return new ResourceNotFoundError(model);
  }
  
  // Check if it's our custom authentication error
  if (error.message?.includes('Authentication required')) {
    return new AuthenticationRequiredError(model, action);
  }
  
  // Check if it's a permission error
  if (error.code === 'P2003' || error.message?.includes('permission')) {
    return new UnauthorizedAccessError(model, action);
  }
  
  // Return original error if not RLS-related
  return error;
}