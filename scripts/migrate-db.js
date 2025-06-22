#!/usr/bin/env node

/**
 * Database Migration Script for GetMeToDubai
 * Handles transitioning from demo mode to production database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
const prisma = new PrismaClient();

// Demo data for seeding
const demoData = {
  users: [
    {
      email: 'demo@getmetodubai.com',
      name: 'Demo User',
      phone: '+1234567890',
      membershipTier: 'PLATINUM',
      createdAt: new Date('2024-01-01'),
    },
    {
      email: 'admin@getmetodubai.com', 
      name: 'Admin User',
      phone: '+1234567891',
      membershipTier: 'ADMIN',
      createdAt: new Date('2024-01-01'),
    }
  ],
  
  bookings: [
    {
      type: 'FLIGHT',
      status: 'CONFIRMED',
      details: {
        from: 'JFK',
        to: 'DXB',
        departure: '2024-02-15T10:00:00Z',
        arrival: '2024-02-16T06:00:00Z',
        airline: 'Emirates',
        class: 'Business'
      },
      totalAmount: 2500.00,
      createdAt: new Date('2024-01-15'),
    },
    {
      type: 'HOTEL',
      status: 'CONFIRMED', 
      details: {
        hotel: 'Burj Al Arab',
        checkIn: '2024-02-16',
        checkOut: '2024-02-20',
        rooms: 1,
        guests: 2
      },
      totalAmount: 3000.00,
      createdAt: new Date('2024-01-16'),
    }
  ]
};

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Check if migrations directory exists
    const migrationsPath = path.join(__dirname, '../prisma/migrations');
    if (!fs.existsSync(migrationsPath)) {
      console.log('📁 No migrations directory found, creating...');
      fs.mkdirSync(migrationsPath, { recursive: true });
    }
    
    // Apply migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ Migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database with demo data...');
  
  try {
    // Create demo users
    for (const userData of demoData.users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });
    }
    
    // Get demo user for bookings
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@getmetodubai.com' }
    });
    
    if (demoUser) {
      // Create demo bookings
      for (const bookingData of demoData.bookings) {
        await prisma.booking.create({
          data: {
            ...bookingData,
            userId: demoUser.id,
          },
        });
      }
    }
    
    console.log('✅ Database seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    return false;
  }
}

async function validateSchema() {
  console.log('🔍 Validating database schema...');
  
  try {
    // Check if main tables exist
    const tables = ['User', 'Booking', 'Payment'];
    
    for (const table of tables) {
      const count = await prisma[table.toLowerCase()].count();
      console.log(`✅ Table ${table}: ${count} records`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    return false;
  }
}

async function createBackup() {
  console.log('💾 Creating database backup...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../backups/backup-${timestamp}.sql`);
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // For PostgreSQL
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres')) {
      const { execSync } = require('child_process');
      execSync(`pg_dump "${process.env.DATABASE_URL}" > "${backupPath}"`, { stdio: 'inherit' });
      console.log(`✅ Backup created: ${backupPath}`);
    } else {
      console.log('⚠️  Backup skipped (not PostgreSQL or no DATABASE_URL)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration process...');
  console.log('=========================================');
  
  const tasks = [
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Run Migrations', fn: runMigrations },
    { name: 'Validate Schema', fn: validateSchema },
    { name: 'Seed Database', fn: seedDatabase },
    { name: 'Create Backup', fn: createBackup },
  ];
  
  for (const task of tasks) {
    console.log(`\n📋 ${task.name}...`);
    const success = await task.fn();
    
    if (!success) {
      console.error(`❌ ${task.name} failed. Stopping migration.`);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Database migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update ENABLE_DATABASE=true in your environment');
  console.log('2. Test database connectivity');
  console.log('3. Monitor application logs');
  
  await prisma.$disconnect();
}

// Handle CLI arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'migrate':
    runMigrations().then(() => prisma.$disconnect());
    break;
  case 'seed':
    seedDatabase().then(() => prisma.$disconnect());
    break;
  case 'backup':
    createBackup().then(() => prisma.$disconnect());
    break;
  case 'validate':
    validateSchema().then(() => prisma.$disconnect());
    break;
  default:
    main();
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  await prisma.$disconnect();
  process.exit(0);
});