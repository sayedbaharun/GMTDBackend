import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/express';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../types';

const prismaClient = new PrismaClient();

/**
 * # User Dashboard Controller
 * Handles user dashboard information and statistics
 */

/**
 * Get user dashboard overview with key statistics
 * @route GET /api/user/dashboard
 */
export const getDashboardOverview = async (req: AuthenticatedRequest, res: Response) => {
  // DEVELOPMENT MOCK: Return mock data instead of hitting database
  // Mock user dashboard data
  const mockDashboardData = {
    upcomingTrips: [
      {
        id: 'trip-1',
        destination: 'Dubai Marina',
        startDate: '2025-06-15T00:00:00.000Z',
        endDate: '2025-06-22T00:00:00.000Z',
        status: 'CONFIRMED',
        bookingType: 'Hotel + Flight',
        totalPrice: 2450.00
      },
      {
        id: 'trip-2',
        destination: 'Palm Jumeirah',
        startDate: '2025-07-10T00:00:00.000Z',
        endDate: '2025-07-17T00:00:00.000Z',
        status: 'CONFIRMED',
        bookingType: 'Luxury Package',
        totalPrice: 4200.00
      }
    ],
    subscriptionStatus: {
      tier: 'PREMIUM',
      validUntil: '2025-12-31T00:00:00.000Z',
      benefits: ['Priority Booking', 'Exclusive Offers', 'Concierge Service']
    },
    recentActivity: [
      {
        id: 'activity-1',
        type: 'BOOKING',
        description: 'Booked Burj Al Arab Experience',
        timestamp: '2025-05-05T14:30:00.000Z'
      },
      {
        id: 'activity-2',
        type: 'PAYMENT',
        description: 'Payment processed for Dubai Marina booking',
        timestamp: '2025-05-04T10:15:00.000Z'
      },
      {
        id: 'activity-3',
        type: 'ACCOUNT',
        description: 'Updated travel preferences',
        timestamp: '2025-05-03T16:45:00.000Z'
      }
    ],
    savedDestinations: [
      {
        id: 'dest-1',
        name: 'Burj Khalifa',
        imageUrl: 'https://example.com/burj-khalifa.jpg'
      },
      {
        id: 'dest-2',
        name: 'Dubai Mall',
        imageUrl: 'https://example.com/dubai-mall.jpg'
      },
      {
        id: 'dest-3',
        name: 'Dubai Desert Safari',
        imageUrl: 'https://example.com/desert-safari.jpg'
      }
    ]
  };

  return res.status(200).json({
    success: true,
    data: mockDashboardData
  });
};

/**
 * Get user's booking history with pagination
 * @route GET /api/user/dashboard/bookings
 */
export const getBookingHistory = async (req: AuthenticatedRequest, res: Response) => {
  // DEVELOPMENT MOCK: Return mock data instead of hitting database
  // Extract query parameters with defaults
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const status = req.query.status?.toString().toUpperCase() || undefined;

  // Mock booking history data
  const mockBookings = [
    {
      id: 'booking-1',
      destination: 'Burj Al Arab',
      bookingDate: '2025-04-15T10:30:00.000Z',
      checkInDate: '2025-06-15T14:00:00.000Z',
      checkOutDate: '2025-06-22T12:00:00.000Z',
      status: 'CONFIRMED',
      totalPrice: 4500.00,
      currency: 'USD',
      bookingType: 'Hotel',
      guests: 2
    },
    {
      id: 'booking-2',
      destination: 'Dubai Creek Harbor',
      bookingDate: '2025-04-02T08:45:00.000Z',
      checkInDate: '2025-05-10T15:00:00.000Z',
      checkOutDate: '2025-05-15T11:00:00.000Z',
      status: 'COMPLETED',
      totalPrice: 2200.00,
      currency: 'USD',
      bookingType: 'Hotel + Activities',
      guests: 3
    },
    {
      id: 'booking-3',
      destination: 'Dubai Marina Yacht Club',
      bookingDate: '2025-03-20T13:15:00.000Z',
      checkInDate: '2025-07-05T09:00:00.000Z',
      checkOutDate: '2025-07-05T17:00:00.000Z',
      status: 'CONFIRMED',
      totalPrice: 1800.00,
      currency: 'USD',
      bookingType: 'Yacht Charter',
      guests: 6
    },
    {
      id: 'booking-4',
      destination: 'Desert Safari Experience',
      bookingDate: '2025-03-10T16:30:00.000Z',
      checkInDate: '2025-04-20T15:30:00.000Z',
      checkOutDate: '2025-04-20T22:00:00.000Z',
      status: 'COMPLETED',
      totalPrice: 750.00,
      currency: 'USD',
      bookingType: 'Activity',
      guests: 4
    },
    {
      id: 'booking-5',
      destination: 'The Palm Luxury Villa',
      bookingDate: '2025-02-28T11:00:00.000Z',
      checkInDate: '2025-08-01T16:00:00.000Z',
      checkOutDate: '2025-08-10T10:00:00.000Z',
      status: 'PENDING',
      totalPrice: 8500.00,
      currency: 'USD',
      bookingType: 'Villa Rental',
      guests: 8
    }
  ];

  // Filter bookings by status if provided
  const filteredBookings = status 
    ? mockBookings.filter(booking => booking.status === status)
    : mockBookings;

  // Paginate results
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = filteredBookings.slice(startIndex, endIndex);
  const total = filteredBookings.length;

  return res.status(200).json({
    success: true,
    data: {
      bookings: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  });
};

/**
 * Get user's activity timeline
 * @route GET /api/user/dashboard/timeline
 */
export const getActivityTimeline = async (req: AuthenticatedRequest, res: Response) => {
  // DEVELOPMENT MOCK: Return mock data instead of hitting database
  // Mock activity timeline data
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'BOOKING',
      title: 'New Booking',
      description: 'Booked Burj Al Arab Experience',
      timestamp: '2025-05-05T14:30:00.000Z'
    },
    {
      id: 'activity-2',
      type: 'PAYMENT',
      title: 'Payment Processed',
      description: 'Payment for Dubai Marina booking (AED 9,000)',
      timestamp: '2025-05-04T10:15:00.000Z'
    },
    {
      id: 'activity-3',
      type: 'ACCOUNT',
      title: 'Profile Updated',
      description: 'Updated travel preferences',
      timestamp: '2025-05-03T16:45:00.000Z'
    },
    {
      id: 'activity-4',
      type: 'BOOKING',
      title: 'Booking Confirmed',
      description: 'Your Desert Safari booking is confirmed',
      timestamp: '2025-05-02T09:20:00.000Z'
    },
    {
      id: 'activity-5',
      type: 'SUBSCRIPTION',
      title: 'Plan Upgraded',
      description: 'Upgraded to Premium membership',
      timestamp: '2025-05-01T13:10:00.000Z'
    },
    {
      id: 'activity-6',
      type: 'SUPPORT',
      title: 'Support Request',
      description: 'Inquiry about airport transfers resolved',
      timestamp: '2025-04-29T15:50:00.000Z'
    },
    {
      id: 'activity-7',
      type: 'BOOKING',
      title: 'Booking Modified',
      description: 'Changed dates for Atlantis Hotel stay',
      timestamp: '2025-04-27T11:35:00.000Z'
    },
    {
      id: 'activity-8',
      type: 'ACCOUNT',
      title: 'Account Created',
      description: 'Welcome to Get Me To Dubai!',
      timestamp: '2025-04-25T08:00:00.000Z'
    }
  ];

  return res.status(200).json({
    success: true,
    data: mockActivities
  });
};

/**
 * Get user's travel preferences
 * @route GET /api/user/dashboard/preferences
 */
export const getTravelPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // DEVELOPMENT MOCK: Return mock data instead of hitting database
    // Mock travel preferences data
    const mockPreferences = {
      accommodationPreferences: {
        preferredAccommodationType: 'HOTEL',
        preferredRoomType: 'SUITE',
        preferredAmenities: ['POOL', 'SPA', 'OCEAN_VIEW', 'ROOM_SERVICE']
      },
      dietaryRequirements: ['VEGETARIAN'],
      transportPreferences: {
        preferredAirlineClass: 'BUSINESS',
        preferredCarType: 'LUXURY'
      },
      tripTypes: ['LUXURY', 'BEACH', 'CULTURAL'],
      favoriteCuisines: ['MEDITERRANEAN', 'ASIAN', 'MIDDLE_EASTERN'],
      accessibility: ['ELEVATOR_ACCESS'],
      budget: {
        currency: 'USD',
        range: 'PREMIUM' // BUDGET, MODERATE, PREMIUM, ULTRA_LUXURY
      }
    };

    // In development, we don't need to access the database at all
    return res.status(200).json({
      success: true,
      data: mockPreferences
    });

    /* In production, we would use this code:
    if (!req.user?.id) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get the user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    // In production with a real database, we would create a profile if it doesn't exist
    // But for now we'll just return mock data
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: mockPreferences
      });
    }
    
    // Return the profile preferences or default preferences if not set
    return res.status(200).json({
      success: true,
      data: profile.preferences || mockPreferences
    });
    */
  } catch (error) {
    console.error('Error fetching travel preferences:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch travel preferences', 500);
  }
};

/**
 * Update user's travel preferences
 * @route PUT /api/user/dashboard/preferences
 */
export const updateTravelPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real implementation, we would validate the req.body and update the database
    // For now, just return success with the sent preferences
    return res.status(200).json({
      success: true,
      message: 'Travel preferences updated successfully',
      data: req.body
    });
  } catch (error) {
    console.error('Error updating travel preferences:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update travel preferences', 500);
  }
}; 