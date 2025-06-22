/**
 * Admin Authentication Middleware
 * Verifies admin JWT tokens and attaches admin info to request
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, hasPermission } from '../utils/adminJwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

/**
 * Verify admin JWT token middleware
 */
export async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = verifyAdminToken(token);
      
      // Check if admin exists and is active
      const admin = await prisma.$queryRaw<any[]>`
        SELECT id, email, name, role, is_active
        FROM admins
        WHERE id = ${decoded.id}::uuid AND is_active = true
      `.then(rows => rows[0]);

      if (!admin || !admin.is_active) {
        res.status(401).json({
          success: false,
          error: 'Admin account not found or inactive'
        });
        return;
      }

      // Check if session is still valid
      const session = await prisma.$queryRaw<any[]>`
        SELECT id FROM admin_sessions
        WHERE admin_id = ${admin.id}::uuid AND token = ${token} AND expires_at > NOW()
      `.then(rows => rows[0]);

      if (!session) {
        res.status(401).json({
          success: false,
          error: 'Session expired or invalid'
        });
        return;
      }

      // Attach admin to request
      req.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      };

      // Log activity
      await logAdminActivity(admin.id, 'api_request', req.path, {
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      next();
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Invalid admin token'
      });
    }
  } catch (error: any) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Check if admin has required permission
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
      return;
    }

    if (!hasPermission(req.admin.role, permission)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Check if admin has one of the required roles
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        error: `Required role: ${roles.join(' or ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Log admin activity
 */
async function logAdminActivity(
  adminId: string,
  action: string,
  resource: string,
  details?: any
): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO admin_activity_logs
      (admin_id, action, resource, details, ip_address, user_agent)
      VALUES (
        ${adminId}::uuid,
        ${action},
        ${resource},
        ${JSON.stringify(details || {})}::jsonb,
        ${details?.ip || null}::inet,
        ${details?.userAgent || null}
      )
    `;
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}