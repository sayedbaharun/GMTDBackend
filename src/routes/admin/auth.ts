/**
 * Admin Authentication Routes
 * Handles admin login, logout, and session management
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateAdminToken, generateSecureToken } from '../../utils/adminJwt';
import { authenticateAdmin } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Admin login
 * POST /api/admin/auth/login
 */
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Find admin by email
    const admin = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, role, password_hash, is_active 
      FROM admins 
      WHERE email = ${email} AND is_active = true
    `.then(rows => rows[0]);

    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const token = generateAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour expiry

    await prisma.$executeRaw`
      INSERT INTO admin_sessions (admin_id, token, expires_at, ip_address, user_agent)
      VALUES (
        ${admin.id}::uuid,
        ${token},
        ${expiresAt},
        ${req.ip}::inet,
        ${req.headers['user-agent']}
      )
    `;

    // Update last login
    await prisma.$executeRaw`
      UPDATE admins 
      SET last_login = NOW() 
      WHERE id = ${admin.id}::uuid
    `;

    // Log login activity
    await logActivity(admin.id, 'admin_login', 'auth', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

/**
 * Admin logout
 * POST /api/admin/auth/logout
 */
router.post('/logout', authenticateAdmin, async (req, res): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Delete session
    await prisma.$executeRaw`
      DELETE FROM admin_sessions 
      WHERE token = ${token}
    `;

    // Log logout activity
    await logActivity(req.admin!.id, 'admin_logout', 'auth', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
});

/**
 * Verify admin token
 * GET /api/admin/auth/verify
 */
router.get('/verify', authenticateAdmin, async (req, res): Promise<void> => {
  res.json({
    success: true,
    data: {
      admin: req.admin
    }
  });
});

/**
 * Get admin profile
 * GET /api/admin/auth/profile
 */
router.get('/profile', authenticateAdmin, async (req, res): Promise<void> => {
  try {
    const admin = await prisma.$queryRaw<any[]>`
      SELECT 
        id, email, name, role, is_active, created_at, last_login,
        (SELECT COUNT(*) FROM admin_activity_logs WHERE admin_id = admins.id) as activity_count
      FROM admins 
      WHERE id = ${req.admin!.id}::uuid
    `.then(rows => rows[0]);

    if (!admin) {
      res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
      return;
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error: any) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
});

/**
 * Refresh admin token
 * POST /api/admin/auth/refresh
 */
router.post('/refresh', authenticateAdmin, async (req, res): Promise<void> => {
  try {
    const oldToken = req.headers.authorization?.split(' ')[1];
    
    // Generate new token
    const newToken = generateAdminToken({
      id: req.admin!.id,
      email: req.admin!.email,
      name: req.admin!.name,
      role: req.admin!.role
    });

    // Update session with new token
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    await prisma.$executeRaw`
      UPDATE admin_sessions 
      SET token = ${newToken}, expires_at = ${expiresAt}
      WHERE token = ${oldToken}
    `;

    res.json({
      success: true,
      data: {
        token: newToken,
        admin: req.admin
      }
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      details: error.message
    });
  }
});

/**
 * Get admin activity logs
 * GET /api/admin/auth/activity
 */
router.get('/activity', authenticateAdmin, async (req, res): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await prisma.$queryRaw`
      SELECT 
        id, action, resource, resource_id, details, ip_address, created_at
      FROM admin_activity_logs 
      WHERE admin_id = ${req.admin!.id}::uuid
      ORDER BY created_at DESC
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}
    `;

    const total = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM admin_activity_logs 
      WHERE admin_id = ${req.admin!.id}::uuid
    `.then(rows => Number(rows[0]?.count || 0));

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      }
    });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity logs',
      details: error.message
    });
  }
});

/**
 * Helper function to log activity
 */
async function logActivity(
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
    console.error('Failed to log activity:', error);
  }
}

export default router;