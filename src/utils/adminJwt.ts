/**
 * Admin JWT utilities
 * Separate JWT handling for admin authentication with enhanced security
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Use a separate secret for admin tokens
const ADMIN_JWT_SECRET: string = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_JWT_EXPIRES_IN: string = process.env.ADMIN_JWT_EXPIRES_IN || '2h'; // Shorter expiry for admin tokens

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  type: 'admin'; // Distinguish from user tokens
}

/**
 * Generate admin JWT token
 */
export function generateAdminToken(admin: {
  id: string;
  email: string;
  name: string;
  role: string;
}): string {
  const payload: AdminTokenPayload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    type: 'admin'
  };

  const options: SignOptions = {
    expiresIn: ADMIN_JWT_EXPIRES_IN as any, // JWT accepts string like '2h', '1d' etc
    issuer: 'gmtd-admin',
    audience: 'gmtd-admin-dashboard'
  };

  return jwt.sign(payload, ADMIN_JWT_SECRET, options);
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): AdminTokenPayload {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET, {
      issuer: 'gmtd-admin',
      audience: 'gmtd-admin-dashboard'
    }) as AdminTokenPayload;

    // Extra check to ensure it's an admin token
    if (decoded.type !== 'admin') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    throw new Error(`Invalid admin token: ${error.message}`);
  }
}

/**
 * Generate secure random token for password resets
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if role has permission for action
 */
export function hasPermission(role: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    super_admin: ['*'], // All permissions
    admin: [
      'bookings:read',
      'bookings:update',
      'bookings:delete',
      'users:read',
      'users:update',
      'payments:read',
      'analytics:read'
    ],
    support: [
      'bookings:read',
      'users:read',
      'payments:read'
    ],
    analyst: [
      'bookings:read',
      'analytics:read',
      'reports:read'
    ]
  };

  const rolePermissions = permissions[role] || [];
  
  // Check for wildcard permission
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Check for specific permission
  return rolePermissions.includes(action);
}

/**
 * Log admin JWT secret info (for debugging)
 */
export function logAdminJwtInfo(): void {
  console.log('Admin JWT Configuration:');
  console.log('- Secret length:', ADMIN_JWT_SECRET.length);
  console.log('- Expires in:', ADMIN_JWT_EXPIRES_IN);
  console.log('- Using env secret:', !!process.env.ADMIN_JWT_SECRET);
}