import * as express from 'express';
type Response = express.Response;
import { AuthenticatedRequest } from '../types/express';
import { userService } from '../services/user';
import { logger } from '../utils/logger';

/**
 * Get the current user's profile
 * @route GET /api/user/profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    return res.status(200).json({
      profile: req.user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({ 
      message: 'Failed to get user profile' 
    });
  }
};

/**
 * Update the current user's profile
 * @route PUT /api/user/profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    const profileData = req.body;
    
    const result = await userService.updateUserProfile(req.user.id, profileData);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: result.data
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({ 
      message: 'Failed to update user profile' 
    });
  }
};
