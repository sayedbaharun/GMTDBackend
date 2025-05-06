// Configuration variables for the application

export const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
  },
  
  // App Configuration
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Feature Flags
  featureFlags: {
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
    testMode: process.env.NEXT_PUBLIC_TEST_MODE === 'true',
    stripeTestMode: process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === 'true',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
};

// Validate required configuration variables
const validateConfig = () => {
  const requiredVars = [
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },
    { key: 'NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY },
    { key: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET },
    { key: 'NEXT_PUBLIC_STRIPE_PRICE_ID', value: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID },
    { key: 'AMADEUS_API_KEY', value: process.env.AMADEUS_API_KEY },
    { key: 'AMADEUS_API_SECRET', value: process.env.AMADEUS_API_SECRET },
    { key: 'PORT', value: process.env.PORT },
    { key: 'NODE_ENV', value: process.env.NODE_ENV },
  ];

  const missingVars = requiredVars
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation error:', error);
  process.exit(1);
}
