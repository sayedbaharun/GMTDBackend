import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserProfileData {
  fullName?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  role?: string;
  goals?: string[];
  [key: string]: any;
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export const userService = {
  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: UserProfileData): Promise<ServiceResult> {
    try {
      // Filter out undefined and null values
      const cleanData = Object.entries(profileData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...cleanData,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedUser,
      };
    } catch (error: any) {
      console.error('User service updateUserProfile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update user profile',
        statusCode: 500,
      };
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ServiceResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      console.error('User service getUserById error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user',
        statusCode: 500,
      };
    }
  },
}; 