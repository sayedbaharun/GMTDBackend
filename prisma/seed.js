// Seed script for Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@getmetodubai.com' },
      update: {},
      create: {
        email: 'admin@getmetodubai.com',
        password: adminPassword,
        fullName: 'Admin User',
        phone: '555-999-8888',
        companyName: 'Get Me To Dubai',
        industry: 'Travel',
        role: 'ADMIN',
        onboardingStep: 'completed',
        onboardingComplete: true,
        stripeCustomerId: 'cus_admin',
        profile: {
          create: {
            title: 'System Administrator',
            bio: 'Main administrator of the Get Me To Dubai platform.',
            isAdmin: true,
            adminLevel: 'SUPER_ADMIN'
          }
        }
      }
    });
    console.log(`Created admin user: ${admin.id}`);

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
        role: 'USER',
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

    // Create more test users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const userData = {
        email: `user${i}@example.com`,
        password: await bcrypt.hash(`user${i}pass`, 10),
        fullName: `Test User ${i}`,
        phone: `555-${100 + i}-${2000 + i}`,
        companyName: i % 2 === 0 ? `Business Corp ${i}` : null,
        industry: i % 2 === 0 ? 'Business' : 'Personal',
        role: 'USER',
        onboardingStep: 'completed',
        onboardingComplete: true,
        stripeCustomerId: `cus_user${i}`,
        subscriptionTier: i % 3 === 0 ? 'PREMIUM' : i % 3 === 1 ? 'STANDARD' : 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        profile: {
          create: {
            title: `User ${i}`,
            bio: `Bio for test user ${i}`,
            preferences: {
              preferredAirlines: ['Emirates', 'Qatar Airways'],
              preferredHotels: ['Four Seasons', 'Hilton'],
              travelFrequency: i % 3 === 0 ? 'FREQUENT' : 'OCCASIONAL'
            }
          }
        }
      };

      const newUser = await prisma.user.create({
        data: userData
      });
      users.push(newUser);
      console.log(`Created additional test user: ${newUser.id}`);
    }

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
      },
      {
        airline: 'Emirates',
        flightNumber: 'EK375',
        departureAirport: 'JFK',
        arrivalAirport: 'DXB',
        departureTime: new Date('2025-06-10T21:00:00Z'),
        arrivalTime: new Date('2025-06-11T19:20:00Z'),
        price: 1850.00,
        class: 'BUSINESS',
        availableSeats: 24
      },
      {
        airline: 'Qatar Airways',
        flightNumber: 'QR724',
        departureAirport: 'DOH',
        arrivalAirport: 'DXB',
        departureTime: new Date('2025-06-15T14:30:00Z'),
        arrivalTime: new Date('2025-06-15T16:45:00Z'),
        price: 420.00,
        class: 'ECONOMY',
        availableSeats: 32
      }
    ];

    const createdFlights = [];
    for (const flightData of flights) {
      const flight = await prisma.flight.create({
        data: flightData
      });
      createdFlights.push(flight);
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
      },
      {
        name: 'Burj Al Arab',
        description: 'Iconic luxury hotel with sail-shaped silhouette',
        address: 'Jumeirah St',
        city: 'Dubai',
        country: 'UAE',
        zipCode: '12345',
        latitude: 25.1412,
        longitude: 55.1854,
        starRating: 5.0,
        amenities: ['Private Beach', 'Multiple Pools', 'Luxury Spa', 'Gym', 'Michelin Star Restaurants', 'Butler Service'],
        pricePerNight: 1499.99,
        images: ['https://example.com/burj_1.jpg', 'https://example.com/burj_2.jpg'],
        rooms: {
          create: [
            {
              type: 'DELUXE_SUITE',
              description: 'Deluxe Suite with stunning views',
              price: 1499.99,
              capacity: 2,
              amenities: ['Butler Service', 'Smart Home Controls', 'Premium Bar', 'Jacuzzi']
            },
            {
              type: 'ROYAL_SUITE',
              description: 'Royal Suite with panoramic ocean views',
              price: 2999.99,
              capacity: 4,
              amenities: ['Butler Service', 'Private Elevator', 'In-suite Spa', 'Multiple Bedrooms']
            }
          ]
        }
      }
    ];

    const createdHotels = [];
    for (const hotelData of hotels) {
      const hotel = await prisma.hotel.create({
        data: hotelData,
        include: {
          rooms: true
        }
      });
      createdHotels.push(hotel);
      console.log(`Created hotel: ${hotel.id} with ${hotel.rooms.length} rooms`);
    }

    // Create bookings for our users
    const bookingStatuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];
    const allRooms = await prisma.room.findMany();

    for (let i = 0; i < users.length; i++) {
      // Each user gets 1-3 bookings
      const bookingCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < bookingCount; j++) {
        const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
        const flight = createdFlights[Math.floor(Math.random() * createdFlights.length)];
        const hotel = createdHotels[Math.floor(Math.random() * createdHotels.length)];
        const room = hotel.rooms[Math.floor(Math.random() * hotel.rooms.length)];
        
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30));
        
        const checkInDate = new Date(flight.arrivalTime);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + 3 + Math.floor(Math.random() * 4));
        
        const booking = await prisma.booking.create({
          data: {
            userId: users[i].id,
            status: status,
            totalPrice: room.price * 3 + flight.price,
            paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : status === 'PENDING' ? 'PENDING' : 'PAID',
            paymentIntentId: `pi_booking${i}_${j}`,
            bookedAt: bookingDate,
            flightBookings: {
              create: {
                flightId: flight.id,
                passengerName: users[i].fullName,
                passengerEmail: users[i].email,
                passengerPhone: users[i].phone,
                seatNumber: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`
              }
            },
            hotelBookings: {
              create: {
                hotelId: hotel.id,
                roomId: room.id,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                guestCount: 1 + Math.floor(Math.random() * 2),
                specialRequests: Math.random() > 0.5 ? 'Early check-in requested' : null
              }
            }
          }
        });
        console.log(`Created booking ${j+1} for user ${i+1}: ${booking.id} (${status})`);
      }
    }

    // Create booking for main test user
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
    console.log(`Created booking for main test user: ${booking.id}`);

    // Create support tickets
    const ticketTypes = ['BOOKING_INQUIRY', 'TECHNICAL_ISSUE', 'BILLING_QUESTION', 'GENERAL_QUESTION'];
    const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    for (let i = 0; i < users.length; i++) {
      const ticketCount = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < ticketCount; j++) {
        const type = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
        const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 14));
        
        const ticket = await prisma.supportTicket.create({
          data: {
            userId: users[i].id,
            type: type,
            status: status,
            subject: `${type.replace('_', ' ')} - ${Math.random().toString(36).substring(2, 7)}`,
            description: `This is a test ticket for ${type.replace('_', ' ').toLowerCase()}. Please provide assistance.`,
            createdAt: createdDate,
            assignedTo: status !== 'OPEN' ? admin.id : null,
            messages: {
              create: [
                {
                  userId: users[i].id,
                  content: `Hello, I need help with my ${type.replace('_', ' ').toLowerCase()}. Can you assist?`,
                  timestamp: createdDate
                },
                ...(status !== 'OPEN' ? [{
                  userId: admin.id,
                  content: `Hello ${users[i].fullName}, I'll be happy to help with your ${type.replace('_', ' ').toLowerCase()}. What specifically do you need assistance with?`,
                  timestamp: new Date(createdDate.getTime() + 3600000) // 1 hour later
                }] : []),
                ...(status === 'RESOLVED' || status === 'CLOSED' ? [{
                  userId: users[i].id,
                  content: 'Thank you for your help! That resolved my issue.',
                  timestamp: new Date(createdDate.getTime() + 7200000) // 2 hours later
                }, {
                  userId: admin.id,
                  content: `You're welcome! If you have any other questions, feel free to ask.`,
                  timestamp: new Date(createdDate.getTime() + 7500000) // 2 hours 5 minutes later
                }] : [])
              ]
            }
          }
        });
        console.log(`Created support ticket ${j+1} for user ${i+1}: ${ticket.id} (${status})`);
      }
    }

    // Create main test user support ticket
    const testTicket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        type: 'BOOKING_INQUIRY',
        status: 'IN_PROGRESS',
        subject: 'Question about my Dubai booking',
        description: 'I have some questions about my upcoming trip to Dubai.',
        assignedTo: admin.id,
        messages: {
          create: [
            {
              userId: user.id,
              content: 'Hello, I booked a trip to Dubai and I was wondering if I could get an airport pickup? My flight arrives at 3 AM.',
              timestamp: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
              userId: admin.id,
              content: 'Hello Test User, I would be happy to arrange an airport pickup for you. Could you please provide your flight details?',
              timestamp: new Date(Date.now() - 82800000) // 23 hours ago
            },
            {
              userId: user.id,
              content: 'My flight is EK7890 arriving at 4:15 AM on June 6th, 2025.',
              timestamp: new Date(Date.now() - 79200000) // 22 hours ago
            }
          ]
        }
      }
    });
    console.log(`Created support ticket for main test user: ${testTicket.id}`);

    // Create messaging conversations
    for (let i = 0; i < users.length; i++) {
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [
              { id: admin.id },
              { id: users[i].id }
            ]
          },
          title: `Support conversation for ${users[i].fullName}`,
          messages: {
            create: [
              {
                senderId: users[i].id,
                content: `Hello, I'm interested in planning a trip to Dubai.`,
                timestamp: new Date(Date.now() - 172800000 - i * 3600000) // 2+ days ago, staggered by user
              },
              {
                senderId: admin.id,
                content: `Hello ${users[i].fullName}, I'd be happy to help you plan your trip to Dubai. What dates are you considering?`,
                timestamp: new Date(Date.now() - 169200000 - i * 3600000) // 1 hour after first message
              },
              {
                senderId: users[i].id,
                content: `I'm thinking about visiting in June 2025.`,
                timestamp: new Date(Date.now() - 165600000 - i * 3600000) // 1 hour after second message
              },
              {
                senderId: admin.id,
                content: `June is a great time to visit! Would you like me to send you some package options?`,
                timestamp: new Date(Date.now() - 162000000 - i * 3600000) // 1 hour after third message
              }
            ]
          }
        }
      });
      console.log(`Created conversation for user ${i+1}: ${conversation.id}`);
    }

    // Create a messaging conversation for main test user
    const testConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: admin.id },
            { id: user.id }
          ]
        },
        title: `Travel Planning - ${user.fullName}`,
        messages: {
          create: [
            {
              senderId: user.id,
              content: `Hi there! I'm planning a luxury trip to Dubai and need some guidance.`,
              timestamp: new Date(Date.now() - 259200000) // 3 days ago
            },
            {
              senderId: admin.id,
              content: `Hello ${user.fullName}, welcome to Get Me To Dubai! I'd be delighted to help you plan your luxury Dubai experience. When are you planning to travel?`,
              timestamp: new Date(Date.now() - 258000000) // 20 min after first message
            },
            {
              senderId: user.id,
              content: `I'm thinking of visiting in early June 2025 for about a week.`,
              timestamp: new Date(Date.now() - 255600000) // 40 min after second message
            },
            {
              senderId: admin.id,
              content: `That's a perfect time to visit! The weather will be warm but before the extreme summer heat. Would you prefer staying at the iconic Burj Al Arab or perhaps Atlantis The Palm?`,
              timestamp: new Date(Date.now() - 252000000) // 1 hour after third message
            },
            {
              senderId: user.id,
              content: `The Burj Al Arab sounds amazing! What kind of experiences can you arrange there?`,
              timestamp: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
              senderId: admin.id,
              content: `Excellent choice! At Burj Al Arab, we can arrange a deluxe suite with panoramic views, private butler service, helicopter arrival, fine dining reservations at Al Muntaha, and exclusive beach access. Would you also be interested in desert safari or yacht experiences?`,
              timestamp: new Date(Date.now() - 169200000) // 1 hour after last message
            }
          ]
        }
      }
    });
    console.log(`Created conversation for main test user: ${testConversation.id}`);

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