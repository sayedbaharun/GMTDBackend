/**
 * Simple JWT utility for mobile app authentication
 * This replaces Auth0 for the MVP phase
 */

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: any): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin || false
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'getmetodubai'
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'getmetodubai'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  // Support both "Bearer token" and just "token"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return null;
}

/**
 * Refresh a token (generates a new one with extended expiry)
 */
export async function refreshToken(oldToken: string): Promise<string | null> {
  try {
    const payload = verifyToken(oldToken);
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user) return null;
    
    return generateToken(user);
  } catch (error) {
    return null;
  }
}