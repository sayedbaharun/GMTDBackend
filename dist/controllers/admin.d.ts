import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * Get all users for admin dashboard
 * @route GET /api/admin/users
 */
export declare const getAllUsers: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user details by ID
 * @route GET /api/admin/users/:userId
 */
export declare const getUserById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update user details
 * @route PUT /api/admin/users/:userId
 */
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete a user
 * @route DELETE /api/admin/users/:userId
 */
export declare const deleteUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 */
export declare const getDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get admin statistics (simplified version for frontend)
 * @route GET /api/admin/stats
 */
export declare const getAdminStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get recent activity for admin dashboard
 * @route GET /api/admin/activity
 */
export declare const getRecentActivity: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get all subscriptions for admin dashboard
 * @route GET /api/admin/subscriptions
 */
export declare const getAllSubscriptions: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get all bookings for admin
 * @route GET /api/admin/bookings
 */
export declare const getAllBookings: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get system logs for admin monitoring
 * @route GET /api/admin/logs
 */
export declare const getSystemLogs: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
