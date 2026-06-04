// backend/check-users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking database for users...\n');
  
  // Check all users
  const users = await prisma.ragUser.findMany({
    include: {
      conversations: true
    }
  });
  
  console.log(`📊 Found ${users.length} users in database\n`);
  
  if (users.length === 0) {
    console.log('❌ No users found! The data is not being saved.');
    console.log('💡 Possible issues:');
    console.log('   1. API endpoint not receiving data');
    console.log('   2. Database connection issue');
    console.log('   3. Backend controller not saving data');
  } else {
    users.forEach(user => {
      console.log(`👤 User: ${user.name || 'Anonymous'}`);
      console.log(`   📧 Email: ${user.email || 'Not provided'}`);
      console.log(`   📞 Phone: ${user.phone || 'Not provided'}`);
      console.log(`   💬 Messages: ${user.conversations.length}`);
      console.log(`   🆔 Session: ${user.sessionId}`);
      console.log('---');
    });
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());