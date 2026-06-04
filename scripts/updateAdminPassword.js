// backend/scripts/updateAdminPassword.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const adminEmail = 'admin@aurachronsys.com';
    const newPassword = '';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      // Update existing admin
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Admin password updated successfully!');
      console.log(`   Email: ${updated.email}`);
      console.log(`   Role: ${updated.role}`);
      console.log(`   New Password: ${newPassword}`);
    } else {
      // Create new admin if doesn't exist
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('✅ Admin user created with new password!');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Password: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();