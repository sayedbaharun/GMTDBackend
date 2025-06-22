"use strict";
// Configuration variables for the application
Object.defineProperty(exports, "__esModule", { value: true });
exports.startupValidation = exports.config = void 0;
exports.config = {
    // Stripe Configuration
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
    },
    // App Configuration
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    // Database Configuration
    enableDatabase: process.env.ENABLE_DATABASE !== 'false',
    demoMode: process.env.DEMO_MODE === 'true',
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
const validateEnvironment = () => {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    // Critical variables - app won't start without these
    const criticalVars = [
        { key: 'NODE_ENV', value: process.env.NODE_ENV, default: 'development' },
        { key: 'PORT', value: process.env.PORT, default: '5000' },
    ];
    // Production-required variables
    const productionVars = [
        { key: 'DATABASE_URL', value: process.env.DATABASE_URL, required: exports.config.enableDatabase },
        { key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY },
        { key: 'STRIPE_PUBLISHABLE_KEY', value: process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY },
        { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
        { key: 'AMADEUS_API_KEY', value: process.env.AMADEUS_API_KEY },
        { key: 'AMADEUS_API_SECRET', value: process.env.AMADEUS_API_SECRET },
        { key: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
    ];
    // Optional but recommended variables
    const optionalVars = [
        { key: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET },
        { key: 'CLIENT_URL', value: process.env.CLIENT_URL },
        { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL },
        { key: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY },
    ];
    // Check critical variables
    criticalVars.forEach(({ key, value, default: defaultValue }) => {
        if (!value && !defaultValue) {
            result.errors.push(`Critical environment variable missing: ${key}`);
        }
        else if (!value && defaultValue) {
            result.warnings.push(`Using default value for ${key}: ${defaultValue}`);
        }
    });
    // Check production variables (only in production or when not in demo mode)
    if (process.env.NODE_ENV === 'production' || !exports.config.demoMode) {
        productionVars.forEach(({ key, value, required = true }) => {
            if (required && !value) {
                result.errors.push(`Production environment variable missing: ${key}`);
            }
            else if (!required && !value) {
                result.warnings.push(`Recommended environment variable missing: ${key}`);
            }
        });
    }
    // Check optional variables
    optionalVars.forEach(({ key, value }) => {
        if (!value) {
            result.warnings.push(`Optional environment variable missing: ${key} (some features may be limited)`);
        }
    });
    // Validate API key formats
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
        result.errors.push('OPENAI_API_KEY appears to be invalid (should start with sk-)');
    }
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        result.errors.push('STRIPE_SECRET_KEY appears to be invalid (should start with sk_)');
    }
    if (process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY.startsWith('pk_')) {
        result.warnings.push('STRIPE_PUBLISHABLE_KEY appears to be invalid (should start with pk_)');
    }
    // Check database URL format if database is enabled
    if (exports.config.enableDatabase && process.env.DATABASE_URL) {
        if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
            result.warnings.push('DATABASE_URL should use postgresql:// or postgres:// protocol');
        }
    }
    result.valid = result.errors.length === 0;
    return result;
};
// Startup validation
const startupValidation = () => {
    console.log('🔍 Validating environment configuration...');
    const validation = validateEnvironment();
    // Log warnings
    if (validation.warnings.length > 0) {
        console.log('\n⚠️  Configuration Warnings:');
        validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    // Log errors and exit if invalid
    if (!validation.valid) {
        console.error('\n❌ Configuration Errors:');
        validation.errors.forEach(error => console.error(`   • ${error}`));
        console.error('\n💡 Fix these errors and restart the application.');
        if (exports.config.demoMode) {
            console.log('\n🎭 Demo Mode Tips:');
            console.log('   • Set DEMO_MODE=true to bypass some validation');
            console.log('   • Set ENABLE_DATABASE=false to skip database requirements');
            console.log('   • Use test API keys for Stripe and OpenAI');
        }
        process.exit(1);
    }
    // Success message
    console.log('✅ Environment validation passed');
    if (exports.config.demoMode) {
        console.log('🎭 Running in DEMO MODE - some features use mock data');
    }
    if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Production environment detected');
    }
    console.log(`📊 Database: ${exports.config.enableDatabase ? 'Enabled' : 'Disabled'}`);
    console.log(`🔧 Features: ${Object.entries(exports.config.featureFlags).filter(([_, enabled]) => enabled).map(([name]) => name).join(', ') || 'None'}`);
};
exports.startupValidation = startupValidation;
//# sourceMappingURL=index.js.map