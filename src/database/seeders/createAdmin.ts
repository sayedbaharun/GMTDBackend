/**
 * Admin Seeder Script
 * Creates initial super admin account
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔄 Creating super admin account...');
    
    // Admin details
    const adminData = {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@getmetodubai.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@GMTD2024!',
      name: 'Super Admin',
      role: 'super_admin'
    };

    // Check if admin already exists
    const existingAdmin = await prisma.$queryRaw<any[]>`
      SELECT id FROM admins WHERE email = ${adminData.email}
    `.then(rows => rows[0]);

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // Create admin
    const result = await prisma.$executeRaw`
      INSERT INTO admins (email, password_hash, name, role, is_active)
      VALUES (
        ${adminData.email},
        ${passwordHash},
        ${adminData.name},
        ${adminData.role},
        true
      )
    `;

    console.log('✅ Super admin created successfully');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
createSuperAdmin()
  .catch((error) => {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  });