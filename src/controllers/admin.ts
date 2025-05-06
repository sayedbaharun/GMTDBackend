import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { createError } from '../utils/errorHandler';
import { stripeService } from '../services/stripe';

/**
 * Get all users for admin dashboard
 * @route GET /api/admin/users
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
        isAdmin: true,
        isEmailVerified: true,
        onboardingStep: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        lastLoginAt: true,
        phone: true,
        companyName: true,
        industry: true,
        companySize: true,
        role: true,
        profile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.user.count();

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching users: ${error.message}`
    });
  }
};

/**
 * Get user details by ID
 * @route GET /api/admin/users/:userId
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    const { userId } = req.params;

    // Get user details
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        profile: true,
        bookings: {
          orderBy: {
            bookedAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If user has a Stripe customer ID, fetch their subscription details
    let subscriptionDetails = null;
    if (user.stripeCustomerId) {
      try {
        const subscriptionInfo = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
        subscriptionDetails = subscriptionInfo;
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Continue without subscription details
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        subscriptionDetails
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching user: ${error.message}`
    });
  }
};

/**
 * Update user details
 * @route PUT /api/admin/users/:userId
 */
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    const { userId } = req.params;
    const { 
      fullName, 
      email, 
      isAdmin, 
      onboardingStatus, 
      subscriptionTier, 
      subscriptionStatus,
      profileData 
    } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(isAdmin !== undefined && { isAdmin }),
        ...(onboardingStatus && { onboardingStep: onboardingStatus }),
        ...(subscriptionTier && { subscriptionTier }),
        ...(subscriptionStatus && { subscriptionStatus }),
        updatedAt: new Date()
      },
      include: {
        profile: true
      }
    });

    // Update profile if profile data is provided
    if (profileData && Object.keys(profileData).length > 0) {
      await prisma.profile.upsert({
        where: {
          userId
        },
        update: {
          ...profileData,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Get updated user with profile
    const userWithProfile = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        profile: true
      }
    });

    return res.status(200).json({
      success: true,
      data: userWithProfile
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error updating user: ${error.message}`
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/admin/users/:userId
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    const { userId } = req.params;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If user has Stripe customer ID, cancel any active subscriptions
    if (userExists.stripeCustomerId) {
      try {
        await stripeService.cancelCustomerSubscriptions(userExists.stripeCustomerId);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with deletion even if subscription cancellation fails
      }
    }

    // Delete user's profile first (to handle foreign key constraints)
    await prisma.profile.deleteMany({
      where: {
        userId
      }
    });

    // Delete user's bookings
    await prisma.booking.deleteMany({
      where: {
        userId
      }
    });

    // Delete the user
    await prisma.user.delete({
      where: {
        id: userId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error deleting user: ${error.message}`
    });
  }
};

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get subscription stats
    const activeSubscriptions = await prisma.user.count({
      where: {
        subscriptionStatus: 'active'
      }
    });

    // Get completed onboarding count
    const completedOnboarding = await prisma.user.count({
      where: {
        onboardingStep: 'completed'
      }
    });

    // Get booking stats
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: {
        status: 'CONFIRMED'
      }
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        onboardingStep: true,
        subscriptionStatus: true
      }
    });

    // Calculate subscription rate
    const subscriptionRate = totalUsers > 0 
      ? (activeSubscriptions / totalUsers) * 100 
      : 0;

    // Calculate onboarding completion rate
    const onboardingCompletionRate = totalUsers > 0 
      ? (completedOnboarding / totalUsers) * 100 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          new: newUsers,
          subscriptionRate: subscriptionRate.toFixed(2),
          onboardingCompletionRate: onboardingCompletionRate.toFixed(2)
        },
        subscriptionStats: {
          active: activeSubscriptions
        },
        bookingStats: {
          total: totalBookings,
          active: activeBookings
        },
        recentUsers
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching dashboard statistics: ${error.message}`
    });
  }
};

/**
 * Get all subscriptions for admin dashboard
 * @route GET /api/admin/subscriptions
 */
export const getAllSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string || undefined;
    
    // Build filter
    const filter: any = {};
    if (status) {
      filter.subscriptionStatus = status;
    }
    
    // Only include users with stripe customer IDs
    filter.stripeCustomerId = { not: null };

    // Get users with subscriptions
    const subscriptions = await prisma.user.findMany({
      skip,
      take: limit,
      where: filter,
      select: {
        id: true,
        email: true,
        fullName: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionCurrentPeriodEnd: true,
        subscriptionId: true,
        createdAt: true
      },
      orderBy: {
        subscriptionCurrentPeriodEnd: 'asc'
      }
    });

    // Get total count for pagination
    const total = await prisma.user.count({
      where: filter
    });

    // Fetch detailed subscription data from Stripe if available
    const enhancedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription: {
        id: string;
        email: string;
        fullName: string | null;
        stripeCustomerId: string | null;
        subscriptionStatus: string | null;
        subscriptionTier: string | null;
        subscriptionCurrentPeriodEnd: Date | null;
        subscriptionId: string | null;
        createdAt: Date;
      }) => {
        if (subscription.stripeCustomerId && subscription.subscriptionId) {
          try {
            const stripeData = await stripeService.getSubscriptionDetails(subscription.subscriptionId);
            return {
              ...subscription,
              stripeData
            };
          } catch (stripeError) {
            console.error(`Error fetching Stripe subscription for ${subscription.id}:`, stripeError);
            return subscription;
          }
        }
        return subscription;
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        subscriptions: enhancedSubscriptions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching subscriptions: ${error.message}`
    });
  }
};

/**
 * Get all bookings for admin dashboard
 */
export const getAllBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.page as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string || undefined;
    
    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      skip,
      take: limit,
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        flightBookings: {
          include: {
            flight: {
              select: {
                id: true,
                flightNumber: true,
                departureAirport: true,
                arrivalAirport: true,
                departureTime: true
              }
            }
          }
        },
        hotelBookings: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: {
        bookedAt: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.booking.count({
      where: filter
    });

    return res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching bookings: ${error.message}`
    });
  }
};

/**
 * Get system logs for admin dashboard
 */
export const getSystemLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const level = req.query.level as string || undefined;
    
    // Build filter
    const filter: any = {};
    if (level) {
      filter.level = level;
    }

    // Get system logs with pagination (assuming SystemLog model exists)
    // If you don't have a system log model yet, you'll need to create one
    // For now, mocking a response
    const logs = [
      { 
        id: '1', 
        timestamp: new Date().toISOString(), 
        level: 'info', 
        message: 'System started successfully',
        source: 'server',
        meta: {}
      },
      { 
        id: '2', 
        timestamp: new Date().toISOString(), 
        level: 'error', 
        message: 'Payment processing failed',
        source: 'payment-service',
        meta: { userId: 'user123', amount: 19.99 }
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total: logs.length,
          page,
          limit,
          pages: Math.ceil(logs.length / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching system logs: ${error.message}`
    });
  }
};
