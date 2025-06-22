const { PrismaClient } = require('@prisma/client');

// Force reload of Prisma client after schema changes
Object.keys(require.cache).forEach(key => {
  if (key.includes('@prisma/client')) {
    delete require.cache[key];
  }
});

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create admin user with isAdmin flag set to true
    const adminUser = await prisma.user.upsert({
      where: {
        email: 'admin@getmetodubai.com'
      },
      update: {
        isAdmin: true
      },
      create: {
        email: 'admin@getmetodubai.com',
        fullName: 'System Admin',
        auth0Id: 'auth0|admin-temp-id', // Temporary auth0Id for local admin
        isAdmin: true,
        isEmailVerified: true,
        onboardingStep: 'completed',
        onboardingComplete: true,
        profile: {
          create: {
            title: 'System Administrator',
            bio: 'System administrator with full access to the admin dashboard'
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log(`Admin user created/updated: ${JSON.stringify(adminUser, null, 2)}`);
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Admin user creation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create admin user:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };