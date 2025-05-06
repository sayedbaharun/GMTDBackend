const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-sign-key';

async function loginAdmin() {
  try {
    // Get admin user from database
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });

    if (!user) {
      console.error('Admin user not found in database');
      return null;
    }

    // Create JWT token directly (bypassing login endpoint)
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Generated admin auth token:', token);
    return token;
  } catch (error) {
    console.error('Error logging in admin:', error);
    return null;
  }
}

async function testDashboardStats(token) {
  try {
    console.log('\n🔍 Testing Dashboard Stats API...');
    const response = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Dashboard stats:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Error getting dashboard stats:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllUsers(token) {
  try {
    console.log('\n🔍 Testing Get All Users API...');
    const response = await axios.get(`${API_URL}/admin/users?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Found ${response.data.data.users.length} users`);
    console.log('Pagination:', response.data.data.pagination);
    if (response.data.data.users.length > 0) {
      console.log('Sample user:', JSON.stringify(response.data.data.users[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('Error getting users:', error.response?.data || error.message);
    return false;
  }
}

async function testGetUserById(token, userId) {
  try {
    console.log(`\n🔍 Testing Get User By ID API for user ${userId}...`);
    const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('User details:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Error getting user by ID:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateUser(token, userId) {
  try {
    console.log(`\n🔍 Testing Update User API for user ${userId}...`);
    const updateData = {
      fullName: 'Updated Admin Name',
      subscriptionTier: 'premium'
    };
    
    const response = await axios.put(`${API_URL}/admin/users/${userId}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Updated user:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating user:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllSubscriptions(token) {
  try {
    console.log('\n🔍 Testing Get All Subscriptions API...');
    const response = await axios.get(`${API_URL}/admin/subscriptions?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Found ${response.data.data.subscriptions.length} subscriptions`);
    console.log('Pagination:', response.data.data.pagination);
    if (response.data.data.subscriptions.length > 0) {
      console.log('Sample subscription:', JSON.stringify(response.data.data.subscriptions[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('Error getting subscriptions:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllBookings(token) {
  try {
    console.log('\n🔍 Testing Get All Bookings API...');
    const response = await axios.get(`${API_URL}/admin/bookings?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Found ${response.data.data.bookings.length} bookings`);
    console.log('Pagination:', response.data.data.pagination);
    if (response.data.data.bookings.length > 0) {
      console.log('Sample booking:', JSON.stringify(response.data.data.bookings[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('Error getting bookings:', error.response?.data || error.message);
    return false;
  }
}

async function testGetSystemLogs(token) {
  try {
    console.log('\n🔍 Testing Get System Logs API...');
    const response = await axios.get(`${API_URL}/admin/system-logs?page=1&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Found ${response.data.data.logs.length} logs`);
    console.log('Pagination:', response.data.data.pagination);
    if (response.data.data.logs.length > 0) {
      console.log('Sample log:', JSON.stringify(response.data.data.logs[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('Error getting system logs:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  try {
    console.log('Starting admin API tests...');
    
    // Login as admin
    const token = await loginAdmin();
    if (!token) {
      console.error('Failed to login as admin. Tests aborted.');
      process.exit(1);
    }

    // Get admin user ID
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });
    const adminUserId = user.id;
    
    // Run tests
    const tests = [
      await testDashboardStats(token),
      await testGetAllUsers(token),
      await testGetUserById(token, adminUserId),
      await testUpdateUser(token, adminUserId),
      await testGetAllSubscriptions(token),
      await testGetAllBookings(token),
      await testGetSystemLogs(token)
    ];
    
    // Print summary
    const passedTests = tests.filter(result => result).length;
    const totalTests = tests.length;
    
    console.log('\n📊 Test Summary');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('✅ All admin API tests passed!');
    } else {
      console.log('❌ Some tests failed. See logs above for details.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests();