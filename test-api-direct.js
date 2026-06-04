// backend/test-api-direct.js
const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');
  
  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'admin@aurachronsys.com',
    password: 'admin123'
  });
  const token = loginRes.data.token;
  console.log('✅ Login successful\n');
  
  // 2. Get all users
  console.log('2. Fetching all users...');
  try {
    const usersRes = await axios.get('http://localhost:5000/api/rag/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${usersRes.data.data.length} users`);
    console.log('Users:', JSON.stringify(usersRes.data.data, null, 2));
  } catch (error) {
    console.error('❌ Error fetching users:', error.response?.data || error.message);
  }
}

testAPI();