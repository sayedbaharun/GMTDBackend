/**
 * Authentication Service
 */

import api from './api';
import type { ApiResponse } from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

class AuthService {
  /**
   * Admin login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/admin/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { token, admin } = response.data.data;
      
      // Store token and user info
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Login failed');
  }

  /**
   * Admin logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  }

  /**
   * Verify current token
   */
  async verify(): Promise<AdminUser> {
    const response = await api.get<ApiResponse<{ admin: AdminUser }>>('/admin/auth/verify');
    
    if (response.data.success && response.data.data) {
      return response.data.data.admin;
    }
    
    throw new Error('Token verification failed');
  }

  /**
   * Get current admin from local storage
   */
  getCurrentAdmin(): AdminUser | null {
    const adminStr = localStorage.getItem('adminUser');
    if (adminStr) {
      try {
        return JSON.parse(adminStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<string> {
    const response = await api.post<ApiResponse<LoginResponse>>('/admin/auth/refresh');
    
    if (response.data.success && response.data.data) {
      const { token } = response.data.data;
      localStorage.setItem('adminToken', token);
      return token;
    }
    
    throw new Error('Token refresh failed');
  }
}

export const authService = new AuthService();
export default authService;