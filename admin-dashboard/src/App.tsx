/**
 * Main App Component
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Services
import authService from './services/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  useEffect(() => {
    // Verify token on app load
    const verifyAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.verify();
        } catch (error) {
          console.error('Token verification failed:', error);
          authService.logout();
        }
      }
    };
    
    verifyAuth();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<div>Bookings Page (Coming Soon)</div>} />
            <Route path="users" element={<div>Users Page (Coming Soon)</div>} />
            <Route path="analytics" element={<div>Analytics Page (Coming Soon)</div>} />
            <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
            <Route path="profile" element={<div>Profile Page (Coming Soon)</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
