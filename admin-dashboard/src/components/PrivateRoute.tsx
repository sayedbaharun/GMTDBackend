/**
 * Private Route Component
 * Protects routes that require authentication
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const admin = authService.getCurrentAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && admin && !roles.includes(admin.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}