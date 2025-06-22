/**
 * Backend Demo Mode Service
 * Handles backend functionality in demo mode without requiring database/Auth0
 */

interface DemoUser {
  id: string;
  auth0Id: string;
  fullName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: string;
}

interface DemoBooking {
  id: string;
  bookingReference: string;
  userId: string;
  status: string;
  bookingType: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  guestDetails: any;
}

interface DemoConversation {
  id: string;
  userId: string;
  status: string;
  type: string;
  agentType: string;
  escalated: boolean;
  createdAt: string;
  updatedAt: string;
}

class BackendDemoModeService {
  private demoUsers: DemoUser[] = [
    {
      id: 'demo-user-001',
      auth0Id: 'auth0|demo001',
      fullName: 'Sarah Al-Mansouri',
      email: 'sarah@example.com',
      phone: '+971 50 123 4567',
      isAdmin: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-admin-001',
      auth0Id: 'auth0|admin001', 
      fullName: 'Ahmad Hassan',
      email: 'admin@getmetodubai.com',
      phone: '+971 50 987 6543',
      isAdmin: true,
      createdAt: new Date().toISOString()
    }
  ];

  private demoBookings: DemoBooking[] = [
    {
      id: 'demo-booking-001',
      bookingReference: 'GMTD-2024-001',
      userId: 'demo-user-001',
      status: 'confirmed',
      bookingType: 'flight',
      totalAmount: 2450,
      currency: 'AED',
      createdAt: new Date().toISOString(),
      guestDetails: {
        name: 'Sarah Al-Mansouri',
        email: 'sarah@example.com',
        phone: '+971 50 123 4567'
      }
    },
    {
      id: 'demo-booking-002',
      bookingReference: 'GMTD-2024-002',
      userId: 'demo-user-001',
      status: 'confirmed',
      bookingType: 'hotel',
      totalAmount: 4500,
      currency: 'AED',
      createdAt: new Date().toISOString(),
      guestDetails: {
        name: 'Sarah Al-Mansouri',
        email: 'sarah@example.com',
        phone: '+971 50 123 4567'
      }
    }
  ];

  private demoConversations: DemoConversation[] = [
    {
      id: 'demo-conv-001',
      userId: 'auth0|demo001',
      status: 'OPEN',
      type: 'FLIGHT',
      agentType: 'flight',
      escalated: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-conv-002',
      userId: 'auth0|demo001',
      status: 'CLOSED',
      type: 'HOTEL',
      agentType: 'hotel',
      escalated: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString()
    }
  ];

  /**
   * Check if running in demo mode
   */
  isDemoMode(): boolean {
    return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo';
  }

  /**
   * Check if database is enabled
   */
  isDatabaseEnabled(): boolean {
    return process.env.ENABLE_DATABASE !== 'false' && !this.isDemoMode();
  }

  /**
   * Check if Auth0 is enabled
   */
  isAuth0Enabled(): boolean {
    return process.env.ENABLE_AUTH0 !== 'false' && !this.isDemoMode();
  }

  /**
   * Get demo user by auth0Id
   */
  getDemoUser(auth0Id: string): DemoUser | null {
    return this.demoUsers.find(user => user.auth0Id === auth0Id) || null;
  }

  /**
   * Get all demo users
   */
  getDemoUsers(): DemoUser[] {
    return this.demoUsers;
  }

  /**
   * Get demo bookings for user
   */
  getDemoBookings(userId?: string): DemoBooking[] {
    if (userId) {
      return this.demoBookings.filter(booking => booking.userId === userId);
    }
    return this.demoBookings;
  }

  /**
   * Create demo booking
   */
  createDemoBooking(bookingData: any): DemoBooking {
    const bookingId = `demo-booking-${Date.now()}`;
    const bookingRef = `GMTD-${new Date().getFullYear()}-${String(this.demoBookings.length + 1).padStart(3, '0')}`;
    
    const newBooking: DemoBooking = {
      id: bookingId,
      bookingReference: bookingRef,
      userId: bookingData.userId || 'demo-user-001',
      status: 'confirmed',
      bookingType: bookingData.bookingType || 'flight',
      totalAmount: bookingData.amount || 1000,
      currency: bookingData.currency || 'AED',
      createdAt: new Date().toISOString(),
      guestDetails: bookingData.guestDetails || {
        name: 'Demo User',
        email: 'demo@example.com'
      }
    };

    this.demoBookings.push(newBooking);
    return newBooking;
  }

  /**
   * Get demo conversations
   */
  getDemoConversations(userId?: string): DemoConversation[] {
    if (userId) {
      return this.demoConversations.filter(conv => conv.userId === userId);
    }
    return this.demoConversations;
  }

  /**
   * Get escalated demo conversations
   */
  getEscalatedDemoConversations(): DemoConversation[] {
    return this.demoConversations.filter(conv => conv.escalated || conv.status === 'OPEN');
  }

  /**
   * Create demo conversation
   */
  createDemoConversation(conversationData: any): DemoConversation {
    const convId = `demo-conv-${Date.now()}`;
    
    const newConversation: DemoConversation = {
      id: convId,
      userId: conversationData.userId || 'auth0|demo001',
      status: 'OPEN',
      type: conversationData.type || 'GENERAL',
      agentType: conversationData.agentType || 'general',
      escalated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.demoConversations.push(newConversation);
    return newConversation;
  }

  /**
   * Get demo admin statistics
   */
  getDemoAdminStats() {
    return {
      totalUsers: this.demoUsers.filter(u => !u.isAdmin).length,
      totalBookings: this.demoBookings.length,
      totalRevenue: this.demoBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
      activeUsers: 1,
      flightBookings: this.demoBookings.filter(b => b.bookingType === 'flight').length,
      hotelBookings: this.demoBookings.filter(b => b.bookingType === 'hotel').length,
      conversionRate: 23.4,
      avgBookingValue: this.demoBookings.reduce((sum, b) => sum + b.totalAmount, 0) / this.demoBookings.length
    };
  }

  /**
   * Get demo recent activity
   */
  getDemoRecentActivity() {
    return [
      {
        id: '1',
        type: 'booking',
        description: 'New flight booking JFK → DXB by Sarah Al-Mansouri',
        timestamp: '5 minutes ago',
        amount: 2450,
        status: 'success'
      },
      {
        id: '2',
        type: 'user',
        description: 'New VIP member registration - Ahmed Al-Rashid',
        timestamp: '15 minutes ago',
        status: 'success'
      },
      {
        id: '3',
        type: 'booking',
        description: 'Hotel booking Atlantis The Palm by Sarah Al-Mansouri',
        timestamp: '1 hour ago',
        amount: 4500,
        status: 'success'
      }
    ];
  }

  /**
   * Get demo mode info for API responses
   */
  getDemoModeInfo() {
    return {
      demo_mode: true,
      message: 'Running in demo mode - all data is simulated',
      features: {
        real_amadeus_api: true,
        real_openai_chat: true,
        demo_payments: true,
        demo_database: true,
        demo_auth: true
      }
    };
  }
}

export const backendDemoModeService = new BackendDemoModeService();
export default backendDemoModeService;