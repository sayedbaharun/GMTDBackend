"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemLogs = exports.getAllBookings = exports.getAllSubscriptions = exports.getDashboardStats = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const prisma_1 = require("../lib/prisma");
const stripe_1 = require("../services/stripe");
/**
 * Get all users for admin dashboard
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Get users with pagination
        const users = await prisma_1.prisma.user.findMany({
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
        const total = await prisma_1.prisma.user.count();
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching users: ${error.message}`
        });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get user details by ID
 * @route GET /api/admin/users/:userId
 */
const getUserById = async (req, res) => {
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
        const user = await prisma_1.prisma.user.findUnique({
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
                const subscriptionInfo = await stripe_1.stripeService.getCustomerSubscriptions(user.stripeCustomerId);
                subscriptionDetails = subscriptionInfo;
            }
            catch (stripeError) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching user: ${error.message}`
        });
    }
};
exports.getUserById = getUserById;
/**
 * Update user details
 * @route PUT /api/admin/users/:userId
 */
const updateUser = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        const { userId } = req.params;
        const { fullName, email, isAdmin, onboardingStatus, subscriptionTier, subscriptionStatus, profileData } = req.body;
        // Check if user exists
        const userExists = await prisma_1.prisma.user.findUnique({
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
        const updatedUser = await prisma_1.prisma.user.update({
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
            await prisma_1.prisma.profile.upsert({
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
        const userWithProfile = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error updating user: ${error.message}`
        });
    }
};
exports.updateUser = updateUser;
/**
 * Delete a user
 * @route DELETE /api/admin/users/:userId
 */
const deleteUser = async (req, res) => {
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
        const userExists = await prisma_1.prisma.user.findUnique({
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
                await stripe_1.stripeService.cancelCustomerSubscriptions(userExists.stripeCustomerId);
            }
            catch (stripeError) {
                console.error('Error canceling Stripe subscription:', stripeError);
                // Continue with deletion even if subscription cancellation fails
            }
        }
        // Delete user's profile first (to handle foreign key constraints)
        await prisma_1.prisma.profile.deleteMany({
            where: {
                userId
            }
        });
        // Delete user's bookings
        await prisma_1.prisma.booking.deleteMany({
            where: {
                userId
            }
        });
        // Delete the user
        await prisma_1.prisma.user.delete({
            where: {
                id: userId
            }
        });
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error deleting user: ${error.message}`
        });
    }
};
exports.deleteUser = deleteUser;
/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        // Get total users count
        const totalUsers = await prisma_1.prisma.user.count();
        // Get new users in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsers = await prisma_1.prisma.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });
        // Get subscription stats
        const activeSubscriptions = await prisma_1.prisma.user.count({
            where: {
                subscriptionStatus: 'active'
            }
        });
        // Get completed onboarding count
        const completedOnboarding = await prisma_1.prisma.user.count({
            where: {
                onboardingStep: 'completed'
            }
        });
        // Get booking stats
        const totalBookings = await prisma_1.prisma.booking.count();
        const activeBookings = await prisma_1.prisma.booking.count({
            where: {
                status: 'CONFIRMED'
            }
        });
        // Get recent users
        const recentUsers = await prisma_1.prisma.user.findMany({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching dashboard statistics: ${error.message}`
        });
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * Get all subscriptions for admin dashboard
 * @route GET /api/admin/subscriptions
 */
const getAllSubscriptions = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status || undefined;
        // Build filter
        const filter = {};
        if (status) {
            filter.subscriptionStatus = status;
        }
        // Only include users with stripe customer IDs
        filter.stripeCustomerId = { not: null };
        // Get users with subscriptions
        const subscriptions = await prisma_1.prisma.user.findMany({
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
        const total = await prisma_1.prisma.user.count({
            where: filter
        });
        // Fetch detailed subscription data from Stripe if available
        const enhancedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
            if (subscription.stripeCustomerId && subscription.subscriptionId) {
                try {
                    const stripeData = await stripe_1.stripeService.getSubscriptionDetails(subscription.subscriptionId);
                    return {
                        ...subscription,
                        stripeData
                    };
                }
                catch (stripeError) {
                    console.error(`Error fetching Stripe subscription for ${subscription.id}:`, stripeError);
                    return subscription;
                }
            }
            return subscription;
        }));
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching subscriptions: ${error.message}`
        });
    }
};
exports.getAllSubscriptions = getAllSubscriptions;
/**
 * Get all bookings for admin dashboard
 */
const getAllBookings = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.page) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status || undefined;
        // Build filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        // Get bookings with pagination
        const bookings = await prisma_1.prisma.booking.findMany({
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
        const total = await prisma_1.prisma.booking.count({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching bookings: ${error.message}`
        });
    }
};
exports.getAllBookings = getAllBookings;
/**
 * Get system logs for admin dashboard
 */
const getSystemLogs = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user?.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const level = req.query.level || undefined;
        // Build filter
        const filter = {};
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: `Error fetching system logs: ${error.message}`
        });
    }
};
exports.getSystemLogs = getSystemLogs;
//# sourceMappingURL=admin.js.map