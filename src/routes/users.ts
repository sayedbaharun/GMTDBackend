/**
 * User Profile Management Routes
 * Handles user profile CRUD operations
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateMobile, MobileAuthRequest } from '../middleware/mobileAuth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get current user profile
 * GET /api/users/profile
 */
router.get('/profile', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        bookings: {
          take: 10,
          orderBy: { bookedAt: 'desc' }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { 
      fullName, 
      phone, 
      companyName,
      industry,
      companySize,
      role,
      goals,
      referralSource
    } = req.body;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phone,
        companyName,
        industry,
        companySize,
        role,
        goals,
        referralSource,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

/**
 * Update extended profile (bio, title, etc)
 * PUT /api/users/profile/extended
 */
router.put('/profile/extended', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, bio, avatarUrl, preferences } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    // Upsert profile record
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        title,
        bio,
        avatarUrl,
        preferences,
        updatedAt: new Date()
      },
      create: {
        userId,
        title,
        bio,
        avatarUrl,
        preferences
      }
    });

    res.json({
      success: true,
      data: profile,
      message: 'Extended profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update extended profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update extended profile',
      details: error.message
    });
  }
});

/**
 * Complete onboarding
 * POST /api/users/onboarding/complete
 */
router.post('/onboarding/complete', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const onboardingData = req.body;

    // Update user with onboarding data
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: onboardingData.fullName,
        phone: onboardingData.phone,
        companyName: onboardingData.companyName,
        industry: onboardingData.industry,
        companySize: onboardingData.companySize,
        role: onboardingData.role,
        goals: onboardingData.goals || [],
        referralSource: onboardingData.referralSource,
        onboardingComplete: true,
        onboardingStep: 'completed',
        updatedAt: new Date()
      }
    });

    // Create or update profile
    if ((onboardingData.title || onboardingData.bio) && userId) {
      await prisma.profile.upsert({
        where: { userId },
        update: {
          title: onboardingData.title,
          bio: onboardingData.bio,
          updatedAt: new Date()
        },
        create: {
          userId,
          title: onboardingData.title,
          bio: onboardingData.bio
        }
      });
    }

    // Create or update preferences
    if (onboardingData.preferences) {
      await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          ...onboardingData.preferences,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...onboardingData.preferences
        }
      });
    }

    // Get updated user with all relations
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Onboarding completed successfully'
    });
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding',
      details: error.message
    });
  }
});

/**
 * Update user preferences
 * PUT /api/users/preferences
 */
router.put('/preferences', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const preferencesData = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...preferencesData,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...preferencesData
      }
    });

    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: error.message
    });
  }
});

/**
 * Get user statistics
 * GET /api/users/stats
 */
router.get('/stats', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;

    // Get booking statistics
    const totalBookings = await prisma.booking.count({
      where: { userId }
    });

    const completedBookings = await prisma.booking.count({
      where: { 
        userId,
        status: 'COMPLETED'
      }
    });

    const totalSpent = await prisma.booking.aggregate({
      where: { 
        userId,
        paymentStatus: 'PAID'
      },
      _sum: {
        totalPrice: true
      }
    });

    // Get conversation statistics
    const totalConversations = await prisma.conversationParticipant.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        totalSpent: totalSpent._sum.totalPrice || 0,
        totalConversations,
        memberSince: req.user?.createdAt
      }
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
      details: error.message
    });
  }
});

/**
 * Delete user account (soft delete)
 * DELETE /api/users/account
 */
router.delete('/account', authenticateMobile, async (req: MobileAuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { confirmDelete, reason } = req.body;

    if (!confirmDelete) {
      res.status(400).json({
        success: false,
        error: 'Please confirm account deletion'
      });
      return;
    }

    // Soft delete by marking user as inactive
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: false,
        onboardingComplete: false,
        // Add a deletedAt timestamp if you have one
        updatedAt: new Date()
      }
    });

    // Log the deletion reason
    console.log(`User ${userId} deleted account. Reason: ${reason || 'Not provided'}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      details: error.message
    });
  }
});

export default router;