import * as express from 'express';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, fullName } = req.body;
    
    const result = await authService.registerUser(email, password, fullName);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: result.data
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Failed to register user' 
    });
  }
};

/**
 * Login an existing user
 * @route POST /api/auth/login
 */
export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'Login successful',
      session: result.data
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Failed to login' 
    });
  }
};

/**
 * Logout the current user
 * @route POST /api/auth/logout
 */
export const logout = async (req: express.Request, res: express.Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ 
        message: 'No token provided' 
      });
    }
    
    const result = await authService.logoutUser(token);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ 
      message: 'Failed to logout' 
    });
  }
};

/**
 * Request a password reset
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    
    const result = await authService.resetPassword(email);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        message: result.error 
      });
    }
    
    return res.status(200).json({
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    return res.status(500).json({ 
      message: 'Failed to send password reset email' 
    });
  }
};
