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
    // DEVELOPMENT MOCK: Return mock user data
    const mockUsers = {
      users: [
        {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          createdAt: '2025-04-15T10:30:00.000Z',
          updatedAt: '2025-05-01T14:45:00.000Z',
          isAdmin: false,
          isEmailVerified: true,
          onboardingStep: 'completed',
          stripeCustomerId: 'cus_test1',
          subscriptionStatus: 'active',
          subscriptionTier: 'PREMIUM',
          lastLoginAt: '2025-05-07T09:15:00.000Z',
          phone: '+1234567890',
          companyName: 'Example Corp',
          industry: 'Technology',
          companySize: '10-50',
          role: 'USER'
        },
        {
          id: 'user-2',
          email: 'john@example.com',
          fullName: 'John Smith',
          createdAt: '2025-04-20T11:25:00.000Z',
          updatedAt: '2025-05-02T16:30:00.000Z',
          isAdmin: false,
          isEmailVerified: true,
          onboardingStep: 'completed',
          stripeCustomerId: 'cus_test2',
          subscriptionStatus: 'active',
          subscriptionTier: 'STANDARD',
          lastLoginAt: '2025-05-06T14:20:00.000Z',
          phone: '+0987654321',
          companyName: null,
          industry: null,
          companySize: null,
          role: 'USER'
        },
        {
          id: 'user-3',
          email: 'emma@example.com',
          fullName: 'Emma Johnson',
          createdAt: '2025-04-25T09:15:00.000Z',
          updatedAt: '2025-05-03T10:40:00.000Z',
          isAdmin: false,
          isEmailVerified: true,
          onboardingStep: 'completed',
          stripeCustomerId: 'cus_test3',
          subscriptionStatus: 'active',
          subscriptionTier: 'LUXURY',
          lastLoginAt: '2025-05-07T11:05:00.000Z',
          phone: '+1122334455',
          companyName: 'Johnson Enterprises',
          industry: 'Finance',
          companySize: '100-500',
          role: 'USER'
        },
        {
          id: 'user-4',
          email: 'michael@example.com',
          fullName: 'Michael Brown',
          createdAt: '2025-04-30T15:50:00.000Z',
          updatedAt: '2025-05-01T09:10:00.000Z',
          isAdmin: false,
          isEmailVerified: false,
          onboardingStep: 'info',
          stripeCustomerId: null,
          subscriptionStatus: null,
          subscriptionTier: null,
          lastLoginAt: '2025-04-30T15:55:00.000Z',
          phone: null,
          companyName: null,
          industry: null,
          companySize: null,
          role: 'USER'
        },
        {
          id: 'user-5',
          email: 'admin@getmetodubai.com',
          fullName: 'Admin User',
          createdAt: '2025-04-01T08:00:00.000Z',
          updatedAt: '2025-05-05T17:30:00.000Z',
          isAdmin: true,
          isEmailVerified: true,
          onboardingStep: 'completed',
          stripeCustomerId: null,
          subscriptionStatus: null,
          subscriptionTier: null,
          lastLoginAt: '2025-05-07T08:30:00.000Z',
          phone: '+9876543210',
          companyName: 'Get Me To Dubai',
          industry: 'Travel',
          companySize: '10-50',
          role: 'ADMIN'
        }
      ],
      pagination: {
        total: 5,
        page: 1,
        limit: 10,
        pages: 1
      }
    };

    return res.status(200).json({
      success: true,
      data: mockUsers
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
    // DEVELOPMENT MOCK: Return mock user data based on ID
    const { userId } = req.params;
    
    // Mock user data
    const mockUserData = {
      user: {
        id: userId,
        email: userId === 'user-5' ? 'admin@getmetodubai.com' : `user-${userId}@example.com`,
        fullName: userId === 'user-5' ? 'Admin User' : `Test User ${userId}`,
        createdAt: '2025-04-15T10:30:00.000Z',
        updatedAt: '2025-05-01T14:45:00.000Z',
        isAdmin: userId === 'user-5',
        isEmailVerified: true,
        onboardingStep: 'completed',
        stripeCustomerId: userId === 'user-5' ? null : `cus_test${userId}`,
        subscriptionStatus: userId === 'user-5' ? null : 'active',
        subscriptionTier: userId === 'user-5' ? null : 'PREMIUM',
        lastLoginAt: '2025-05-07T09:15:00.000Z',
        phone: '+1234567890',
        companyName: userId === 'user-5' ? 'Get Me To Dubai' : 'Example Corp',
        industry: userId === 'user-5' ? 'Travel' : 'Technology',
        companySize: '10-50',
        role: userId === 'user-5' ? 'ADMIN' : 'USER',
        profile: {
          id: `profile-${userId}`,
          userId: userId,
          bio: 'Travel enthusiast and adventure seeker.',
          preferences: {
            accommodationPreferences: {
              preferredAccommodationType: 'HOTEL',
              preferredRoomType: 'SUITE',
              preferredAmenities: ['POOL', 'SPA', 'OCEAN_VIEW']
            },
            dietaryRequirements: ['VEGETARIAN'],
            transportPreferences: {
              preferredAirlineClass: 'BUSINESS',
              preferredCarType: 'LUXURY'
            }
          }
        },
        bookings: [
          {
            id: `booking-${userId}-1`,
            bookedAt: '2025-05-01T10:00:00Z',
            status: 'CONFIRMED',
            totalPrice: 1349.98,
            currency: 'USD',
            paymentStatus: 'PAID'
          },
          {
            id: `booking-${userId}-2`,
            bookedAt: '2025-04-15T14:30:00Z',
            status: 'COMPLETED',
            totalPrice: 899.99,
            currency: 'USD',
            paymentStatus: 'PAID'
          }
        ]
      },
      subscriptionDetails: userId === 'user-5' ? null : {
        id: `sub_${userId}`,
        status: 'active',
        currentPeriodStart: '2025-05-01T00:00:00Z',
        currentPeriodEnd: '2025-06-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        plan: {
          id: 'plan_premium',
          name: 'Premium Plan',
          amount: 99.99,
          currency: 'USD',
          interval: 'month'
        }
      }
    };

    return res.status(200).json({
      success: true,
      data: mockUserData
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
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // DEVELOPMENT MOCK: Return mock dashboard data
    const mockDashboardData = {
      users: {
        total: 1289,
        newToday: 24,
        activeToday: 345,
        growth: 12.5 // percentage growth from last month
      },
      subscriptions: {
        active: 846,
        premium: 312,
        standard: 403,
        basic: 131,
        revenue: {
          monthly: 412000,
          growth: 15.3
        }
      },
      bookings: {
        total: 4287,
        monthly: 428,
        pending: 43,
        confirmed: 385,
        popular: [
          {
            destination: "Burj Al Arab",
            bookings: 124
          },
          {
            destination: "Palm Jumeirah",
            bookings: 98
          },
          {
            destination: "Dubai Marina",
            bookings: 86
          }
        ]
      },
      recentActivity: [
        {
          type: 'USER_REGISTRATION',
          title: 'New User Registration:',
          description: 'John Smith joined the platform',
          timestamp: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          type: 'SUBSCRIPTION',
          title: 'New Subscription:',
          description: 'Emma Johnson upgraded to Luxury plan',
          timestamp: new Date(Date.now() - 10800000) // 3 hours ago
        },
        {
          type: 'SYSTEM_ALERT',
          title: 'System Alert:',
          description: 'High server load detected on API-02',
          timestamp: new Date(Date.now() - 18000000) // 5 hours ago
        },
        {
          type: 'BOOKING',
          title: 'New Booking:',
          description: 'Alex Davis booked Burj Al Arab experience',
          timestamp: new Date(Date.now() - 25200000) // 7 hours ago
        },
        {
          type: 'SUPPORT',
          title: 'Support Ticket:',
          description: 'New high priority support request from VIP customer',
          timestamp: new Date(Date.now() - 32400000) // 9 hours ago
        }
      ]
    };

    return res.status(200).json({
      success: true,
      data: mockDashboardData
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching dashboard stats: ${error.message}`
    });
  }
};

/**
 * Get admin statistics (simplified version for frontend)
 * @route GET /api/admin/stats
 */
export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock stats matching frontend interface
    const stats = {
      totalUsers: 1247,
      totalBookings: 892,
      totalRevenue: 445600,
      activeUsers: 156,
      flightBookings: 534,
      hotelBookings: 358,
      conversionRate: 23.4,
      avgBookingValue: 1850
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching admin stats: ${error.message}`
    });
  }
};

/**
 * Get recent activity for admin dashboard
 * @route GET /api/admin/activity
 */
export const getRecentActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock activities matching frontend interface
    const activities = [
      {
        id: '1',
        type: 'booking',
        description: 'Flight booking JFK → DXB by John Smith',
        timestamp: '2 minutes ago',
        amount: 1250,
        status: 'success'
      },
      {
        id: '2',
        type: 'user',
        description: 'New VIP member registration - Sarah Johnson',
        timestamp: '5 minutes ago',
        status: 'success'
      },
      {
        id: '3',
        type: 'booking',
        description: 'Hotel booking Burj Al Arab by Michael Chen',
        timestamp: '8 minutes ago',
        amount: 3500,
        status: 'success'
      },
      {
        id: '4',
        type: 'payment',
        description: 'Payment received from Ahmed Al-Rashid',
        timestamp: '12 minutes ago',
        amount: 2100,
        status: 'success'
      },
      {
        id: '5',
        type: 'booking',
        description: 'Flight booking LHR → DXB by Emma Wilson',
        timestamp: '18 minutes ago',
        amount: 980,
        status: 'pending'
      }
    ];

    return res.status(200).json(activities);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching recent activity: ${error.message}`
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
 * Get all bookings for admin
 * @route GET /api/admin/bookings
 */
export const getAllBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // DEVELOPMENT MOCK: Return mock bookings data
    const mockBookings = {
      bookings: [
        {
          id: '1234abcd',
          userName: 'Test User',
          userEmail: 'test@example.com',
          bookedAt: '2025-05-01T10:00:00Z',
          type: 'Hotel + Flight',
          totalPrice: 1349.98,
          status: 'CONFIRMED'
        },
        {
          id: '2345bcde',
          userName: 'John Smith',
          userEmail: 'john@example.com',
          bookedAt: '2025-05-02T14:30:00Z',
          type: 'Hotel Only',
          totalPrice: 899.99,
          status: 'PENDING'
        },
        {
          id: '3456cdef',
          userName: 'Emma Johnson',
          userEmail: 'emma@example.com',
          bookedAt: '2025-05-03T09:15:00Z',
          type: 'Luxury Package',
          totalPrice: 2999.99,
          status: 'CONFIRMED'
        },
        {
          id: '4567defg',
          userName: 'Michael Brown',
          userEmail: 'michael@example.com',
          bookedAt: '2025-05-04T16:45:00Z',
          type: 'Flight Only',
          totalPrice: 450.00,
          status: 'CANCELLED'
        },
        {
          id: '5678efgh',
          userName: 'Sarah Davis',
          userEmail: 'sarah@example.com',
          bookedAt: '2025-05-05T11:20:00Z',
          type: 'Hotel + Activities',
          totalPrice: 1250.50,
          status: 'CONFIRMED'
        },
        {
          id: '6789fghi',
          userName: 'Alex Wilson',
          userEmail: 'alex@example.com',
          bookedAt: '2025-05-06T08:10:00Z',
          type: 'Yacht Charter',
          totalPrice: 4500.00,
          status: 'CONFIRMED'
        },
        {
          id: '7890ghij',
          userName: 'Laura Miller',
          userEmail: 'laura@example.com',
          bookedAt: '2025-05-07T13:40:00Z',
          type: 'Supercar Rental',
          totalPrice: 3200.00,
          status: 'PENDING'
        },
        {
          id: '8901hijk',
          userName: 'Robert Jones',
          userEmail: 'robert@example.com',
          bookedAt: '2025-05-08T09:25:00Z',
          type: 'Restaurant Experience',
          totalPrice: 850.00,
          status: 'CONFIRMED'
        }
      ],
      pagination: {
        total: 56,
        page: 1,
        limit: 10,
        pages: 6
      }
    };

    return res.status(200).json({
      success: true,
      data: mockBookings
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching bookings: ${error.message}`
    });
  }
};

/**
 * Get system logs for admin monitoring
 * @route GET /api/admin/logs
 */
export const getSystemLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // DEVELOPMENT MOCK: Return mock system logs
    const mockSystemLogs = {
      logs: [
        {
          id: 'log-1',
          level: 'INFO',
          message: 'System startup complete',
          timestamp: '2025-05-07T00:00:00Z',
          source: 'server'
        },
        {
          id: 'log-2',
          level: 'WARN',
          message: 'High CPU usage detected (85%)',
          timestamp: '2025-05-07T02:15:00Z',
          source: 'monitoring'
        },
        {
          id: 'log-3',
          level: 'ERROR',
          message: 'Database query timeout after 30s',
          timestamp: '2025-05-07T03:45:00Z',
          source: 'database'
        },
        {
          id: 'log-4',
          level: 'INFO',
          message: 'Scheduled maintenance completed',
          timestamp: '2025-05-07T04:30:00Z',
          source: 'system'
        },
        {
          id: 'log-5',
          level: 'WARN',
          message: 'Memory usage above threshold (75%)',
          timestamp: '2025-05-07T05:20:00Z',
          source: 'monitoring'
        },
        {
          id: 'log-6',
          level: 'ERROR',
          message: 'Payment gateway connection failed',
          timestamp: '2025-05-07T06:10:00Z',
          source: 'payment'
        },
        {
          id: 'log-7',
          level: 'INFO',
          message: 'New deployment successful (v2.4.1)',
          timestamp: '2025-05-07T07:00:00Z',
          source: 'deployment'
        },
        {
          id: 'log-8',
          level: 'WARN',
          message: 'High rate of failed login attempts detected',
          timestamp: '2025-05-07T08:30:00Z',
          source: 'security'
        },
        {
          id: 'log-9',
          level: 'ERROR',
          message: 'External API rate limit exceeded',
          timestamp: '2025-05-07T09:15:00Z',
          source: 'api'
        },
        {
          id: 'log-10',
          level: 'INFO',
          message: 'Daily backup completed successfully',
          timestamp: '2025-05-07T10:00:00Z',
          source: 'backup'
        }
      ],
      pagination: {
        total: 128,
        page: 1,
        limit: 10,
        pages: 13
      },
      systemStatus: {
        status: 'HEALTHY',
        uptime: '7d 12h 34m',
        cpuUsage: 32,
        memoryUsage: 45,
        diskUsage: 28,
        activeUsers: 87,
        lastRestart: '2025-04-30T00:00:00Z'
      }
    };

    return res.status(200).json({
      success: true,
      data: mockSystemLogs
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Error fetching system logs: ${error.message}`
    });
  }
};
