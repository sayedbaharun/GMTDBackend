// Seed script for Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        fullName: 'Test User',
        phone: '555-123-4567',
        companyName: 'Example Corp',
        industry: 'Technology',
        companySize: '10-50',
        role: 'CEO',
        goals: ['Business Travel', 'Leisure Travel'],
        onboardingStep: 'completed',
        onboardingComplete: true,
        stripeCustomerId: 'cus_example',
        profile: {
          create: {
            title: 'Frequent Traveler',
            bio: 'I travel often for business and leisure.',
            preferences: {
              preferredAirlines: ['Delta', 'Emirates'],
              preferredHotels: ['Marriott', 'Hilton'],
              preferredSeats: 'Window',
              dietaryRestrictions: ['Vegetarian']
            }
          }
        }
      }
    });
    console.log(`Created user: ${user.id}`);

    // Create flights
    const flights = [
      {
        airline: 'Delta Airlines',
        flightNumber: 'DL1234',
        departureAirport: 'JFK',
        arrivalAirport: 'LAX',
        departureTime: new Date('2025-06-01T08:00:00Z'),
        arrivalTime: new Date('2025-06-01T11:30:00Z'),
        price: 349.99,
        class: 'ECONOMY',
        availableSeats: 42
      },
      {
        airline: 'American Airlines',
        flightNumber: 'AA5678',
        departureAirport: 'SFO',
        arrivalAirport: 'ORD',
        departureTime: new Date('2025-06-03T10:15:00Z'),
        arrivalTime: new Date('2025-06-03T16:45:00Z'),
        price: 425.50,
        class: 'ECONOMY',
        availableSeats: 28
      },
      {
        airline: 'Emirates',
        flightNumber: 'EK7890',
        departureAirport: 'DXB',
        arrivalAirport: 'LHR',
        departureTime: new Date('2025-06-05T23:30:00Z'),
        arrivalTime: new Date('2025-06-06T04:15:00Z'),
        price: 1250.00,
        class: 'BUSINESS',
        availableSeats: 16
      }
    ];

    for (const flightData of flights) {
      const flight = await prisma.flight.create({
        data: flightData
      });
      console.log(`Created flight: ${flight.id}`);
    }

    // Create hotels
    const hotels = [
      {
        name: 'Grand Hyatt',
        description: 'Luxury hotel in downtown with amazing views',
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        zipCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        starRating: 4.5,
        amenities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service'],
        pricePerNight: 299.99,
        images: ['https://example.com/hotel1_1.jpg', 'https://example.com/hotel1_2.jpg'],
        rooms: {
          create: [
            {
              type: 'STANDARD',
              description: 'Standard room with king bed',
              price: 299.99,
              capacity: 2,
              amenities: ['TV', 'WiFi', 'Mini Bar']
            },
            {
              type: 'DELUXE',
              description: 'Deluxe room with king bed and city view',
              price: 399.99,
              capacity: 2,
              amenities: ['TV', 'WiFi', 'Mini Bar', 'Bathtub', 'City View']
            },
            {
              type: 'SUITE',
              description: 'Suite with separate living area',
              price: 599.99,
              capacity: 4,
              amenities: ['TV', 'WiFi', 'Mini Bar', 'Bathtub', 'Living Room', 'Kitchen']
            }
          ]
        }
      },
      {
        name: 'Beachside Resort',
        description: 'Beautiful beachfront property with stunning ocean views',
        address: '789 Ocean Drive',
        city: 'Miami',
        country: 'USA',
        zipCode: '33139',
        latitude: 25.7617,
        longitude: -80.1918,
        starRating: 4.8,
        amenities: ['Beach Access', 'Pools', 'Spa', 'Gym', 'Multiple Restaurants', 'Water Sports'],
        pricePerNight: 349.99,
        images: ['https://example.com/hotel2_1.jpg', 'https://example.com/hotel2_2.jpg'],
        rooms: {
          create: [
            {
              type: 'GARDEN',
              description: 'Garden view room with queen bed',
              price: 349.99,
              capacity: 2,
              amenities: ['TV', 'WiFi', 'Mini Bar', 'Balcony']
            },
            {
              type: 'OCEAN',
              description: 'Ocean view room with king bed',
              price: 499.99,
              capacity: 2,
              amenities: ['TV', 'WiFi', 'Mini Bar', 'Balcony', 'Ocean View']
            },
            {
              type: 'PENTHOUSE',
              description: 'Penthouse suite with private pool',
              price: 1299.99,
              capacity: 6,
              amenities: ['TV', 'WiFi', 'Mini Bar', 'Private Pool', 'Kitchen', 'Ocean View', 'Multiple Bedrooms']
            }
          ]
        }
      }
    ];

    for (const hotelData of hotels) {
      const hotel = await prisma.hotel.create({
        data: hotelData,
        include: {
          rooms: true
        }
      });
      console.log(`Created hotel: ${hotel.id} with ${hotel.rooms.length} rooms`);
    }

    // Create a booking for our test user
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        status: 'CONFIRMED',
        totalPrice: 1349.98,
        paymentStatus: 'PAID',
        paymentIntentId: 'pi_examplepayment',
        flightBookings: {
          create: {
            flightId: (await prisma.flight.findFirst()).id,
            passengerName: 'Test User',
            passengerEmail: 'test@example.com',
            passengerPhone: '555-123-4567',
            seatNumber: '12A'
          }
        },
        hotelBookings: {
          create: {
            hotelId: (await prisma.hotel.findFirst()).id,
            roomId: (await prisma.room.findFirst()).id,
            checkInDate: new Date('2025-06-01T15:00:00Z'),
            checkOutDate: new Date('2025-06-05T11:00:00Z'),
            guestCount: 2,
            specialRequests: 'Early check-in if possible'
          }
        },
        conciergeRequests: {
          create: {
            userId: user.id,
            requestType: 'RESTAURANT',
            description: 'Reservation for Italian restaurant',
            date: new Date('2025-06-02T19:00:00Z'),
            time: '19:00',
            location: 'Near hotel',
            participants: 2
          }
        }
      }
    });
    console.log(`Created booking: ${booking.id}`);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });