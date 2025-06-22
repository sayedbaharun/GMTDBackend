#!/usr/bin/env node

/**
 * Standalone Environment Validation Script
 * Can be run independently to check environment configuration
 * Usage: node scripts/validate-env.js [--env=production]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const targetEnv = envArg ? envArg.split('=')[1] : process.env.NODE_ENV || 'development';

// Load environment file
const envFile = `.env${targetEnv === 'production' ? '.production' : ''}`;
const envPath = path.join(process.cwd(), envFile);

console.log(`🔍 Validating environment: ${targetEnv}`);
console.log(`📁 Environment file: ${envFile}`);

if (fs.existsSync(envPath)) {
  console.log('✅ Environment file found');
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
} else {
  console.log(`⚠️  Environment file not found: ${envFile}`);
  console.log('Using system environment variables only');
}

// Validation logic (similar to config/index.ts but standalone)
const validation = {
  errors: [],
  warnings: [],
  valid: true
};

// Check critical variables
const criticalVars = ['NODE_ENV', 'PORT'];
criticalVars.forEach(key => {
  if (!process.env[key]) {
    validation.warnings.push(`Critical variable missing: ${key} (will use default)`);
  }
});

// Check production variables
const productionVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY', 
  'OPENAI_API_KEY',
  'AMADEUS_API_KEY',
  'AMADEUS_API_SECRET',
  'SESSION_SECRET'
];

const demoMode = process.env.DEMO_MODE === 'true';
const enableDatabase = process.env.ENABLE_DATABASE !== 'false';

if (targetEnv === 'production' || !demoMode) {
  productionVars.forEach(key => {
    // Skip database check if disabled
    if (key === 'DATABASE_URL' && !enableDatabase) {
      validation.warnings.push(`Database disabled - skipping ${key} check`);
      return;
    }
    
    if (!process.env[key]) {
      validation.errors.push(`Production variable missing: ${key}`);
    }
  });
}

// Check optional variables
const optionalVars = [
  'STRIPE_WEBHOOK_SECRET',
  'CLIENT_URL',
  'FRONTEND_URL',
  'SENDGRID_API_KEY'
];

optionalVars.forEach(key => {
  if (!process.env[key]) {
    validation.warnings.push(`Optional variable missing: ${key} (some features may be limited)`);
  }
});

// Validate API key formats
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  validation.errors.push('OPENAI_API_KEY appears invalid (should start with sk-)');
}

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  validation.errors.push('STRIPE_SECRET_KEY appears invalid (should start with sk_)');
}

if (process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY.startsWith('pk_')) {
  validation.warnings.push('STRIPE_PUBLISHABLE_KEY appears invalid (should start with pk_)');
}

// Check database URL format
if (enableDatabase && process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    validation.warnings.push('DATABASE_URL should use postgresql:// protocol');
  }
}

// Report results
console.log('\n📊 Validation Results:');
console.log('======================');

if (validation.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  validation.warnings.forEach(warning => console.log(`   • ${warning}`));
}

if (validation.errors.length > 0) {
  validation.valid = false;
  console.log('\n❌ Errors:');
  validation.errors.forEach(error => console.log(`   • ${error}`));
}

// Summary
console.log('\n📋 Summary:');
console.log(`Environment: ${targetEnv}`);
console.log(`Demo Mode: ${demoMode ? 'Enabled' : 'Disabled'}`);
console.log(`Database: ${enableDatabase ? 'Enabled' : 'Disabled'}`);
console.log(`Errors: ${validation.errors.length}`);
console.log(`Warnings: ${validation.warnings.length}`);

if (validation.valid) {
  console.log('\n✅ Environment validation PASSED');
  process.exit(0);
} else {
  console.log('\n❌ Environment validation FAILED');
  console.log('\n💡 Fix the errors above and run validation again');
  
  if (demoMode) {
    console.log('\n🎭 Demo Mode Tips:');
    console.log('   • Demo mode bypasses some validation in development');
    console.log('   • Use ENABLE_DATABASE=false to skip database requirements');
    console.log('   • Ensure you have test API keys for Stripe and OpenAI');
  }
  
  process.exit(1);
}