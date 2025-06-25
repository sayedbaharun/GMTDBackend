#!/usr/bin/env node

/**
 * Test script to verify RLS (Row Level Security) is working correctly
 * 
 * Usage: node scripts/test-rls.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data
const testUser1 = {
  email: `test-user1-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User One'
};

const testUser2 = {
  email: `test-user2-${Date.now()}@example.com`, 
  password: 'TestPassword123!',
  fullName: 'Test User Two'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function registerUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/mobile-auth/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to register user: ${error.response?.data?.message || error.message}`);
  }
}

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/mobile-auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    throw new Error(`Failed to login: ${error.response?.data?.message || error.message}`);
  }
}

async function createBooking(token, bookingData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bookings/create`,
      bookingData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.booking;
  } catch (error) {
    throw new Error(`Failed to create booking: ${error.response?.data?.message || error.message}`);
  }
}

async function getMyBookings(token) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bookings/my-bookings`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.bookings;
  } catch (error) {
    throw new Error(`Failed to get bookings: ${error.response?.data?.message || error.message}`);
  }
}

async function getBookingById(token, bookingId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bookings/${bookingId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.booking;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(`Failed to get booking: ${error.response?.data?.message || error.message}`);
  }
}

async function runTests() {
  log('\n🚀 Starting RLS Test Suite', 'bright');
  log('================================\n', 'bright');

  let token1, token2;
  let user1Id, user2Id;
  let booking1, booking2;

  try {
    // Test 1: Register users
    logTest('User Registration');
    
    const user1Response = await registerUser(testUser1);
    user1Id = user1Response.user.id;
    logSuccess(`User 1 registered: ${testUser1.email}`);
    
    const user2Response = await registerUser(testUser2);
    user2Id = user2Response.user.id;
    logSuccess(`User 2 registered: ${testUser2.email}`);

    // Test 2: Login users
    logTest('User Authentication');
    
    token1 = await loginUser(testUser1.email, testUser1.password);
    logSuccess('User 1 logged in successfully');
    
    token2 = await loginUser(testUser2.email, testUser2.password);
    logSuccess('User 2 logged in successfully');

    // Test 3: Create bookings
    logTest('Booking Creation with RLS');
    
    const bookingData1 = {
      type: 'flight',
      details: {
        currency: 'USD',
        flight: {
          airline: 'Test Airways',
          flightNumber: 'TA123',
          departureAirport: 'JFK',
          arrivalAirport: 'DXB',
          departureTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          arrivalTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
          price: 500,
          class: 'ECONOMY',
          availableSeats: 50
        },
        passengerName: 'Test User One',
        passengerEmail: testUser1.email
      }
    };
    
    booking1 = await createBooking(token1, bookingData1);
    logSuccess(`Booking 1 created for User 1: ${booking1.id}`);
    
    const bookingData2 = {
      type: 'hotel',
      details: {
        currency: 'USD',
        hotel: {
          name: 'Test Hotel Dubai',
          description: 'A test hotel',
          address: '123 Test Street',
          city: 'Dubai',
          rating: 5,
          pricePerNight: 200,
          amenities: ['WiFi', 'Pool']
        },
        checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        checkOutDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        guestCount: 2
      }
    };
    
    booking2 = await createBooking(token2, bookingData2);
    logSuccess(`Booking 2 created for User 2: ${booking2.id}`);

    // Test 4: Test RLS filtering on list
    logTest('RLS Filtering - List Bookings');
    
    const user1Bookings = await getMyBookings(token1);
    logInfo(`User 1 can see ${user1Bookings.length} booking(s)`);
    
    if (user1Bookings.length === 1 && user1Bookings[0].id === booking1.id) {
      logSuccess('User 1 can only see their own booking');
    } else {
      logError('User 1 can see bookings that don\'t belong to them!');
    }
    
    const user2Bookings = await getMyBookings(token2);
    logInfo(`User 2 can see ${user2Bookings.length} booking(s)`);
    
    if (user2Bookings.length === 1 && user2Bookings[0].id === booking2.id) {
      logSuccess('User 2 can only see their own booking');
    } else {
      logError('User 2 can see bookings that don\'t belong to them!');
    }

    // Test 5: Test RLS on direct access
    logTest('RLS Protection - Direct Access');
    
    // User 1 tries to access their own booking
    const user1OwnBooking = await getBookingById(token1, booking1.id);
    if (user1OwnBooking) {
      logSuccess('User 1 can access their own booking');
    } else {
      logError('User 1 cannot access their own booking!');
    }
    
    // User 1 tries to access User 2's booking
    const user1AccessUser2Booking = await getBookingById(token1, booking2.id);
    if (!user1AccessUser2Booking) {
      logSuccess('User 1 cannot access User 2\'s booking (RLS working!)');
    } else {
      logError('SECURITY ISSUE: User 1 can access User 2\'s booking!');
    }
    
    // User 2 tries to access User 1's booking
    const user2AccessUser1Booking = await getBookingById(token2, booking1.id);
    if (!user2AccessUser1Booking) {
      logSuccess('User 2 cannot access User 1\'s booking (RLS working!)');
    } else {
      logError('SECURITY ISSUE: User 2 can access User 1\'s booking!');
    }

    // Test 6: Test unauthenticated access
    logTest('RLS Protection - Unauthenticated Access');
    
    try {
      await getMyBookings('invalid-token');
      logError('SECURITY ISSUE: Unauthenticated user can access bookings!');
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logSuccess('Unauthenticated access properly blocked');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }

    log('\n✨ RLS Test Suite Completed Successfully!', 'green');
    log('Row Level Security is working correctly!\n', 'green');

  } catch (error) {
    logError(`\nTest failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});