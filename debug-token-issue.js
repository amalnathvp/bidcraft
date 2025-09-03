const jwt = require('jsonwebtoken');

// Test script to debug JWT token issues
console.log('🔍 JWT Debug Test Starting...');

// Check if JWT_SECRET is available
const JWT_SECRET = 'your_super_secret_jwt_key_here_change_in_production_make_it_very_long_and_random';
console.log('✅ JWT_SECRET exists:', !!JWT_SECRET);

// Create a test token
const testPayload = {
    id: '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId
    email: 'test@example.com'
};

console.log('\n📝 Creating test token...');
const testToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' });
console.log('✅ Test token created:', testToken);
console.log('📏 Token length:', testToken.length);

// Test JWT format validation regex
const jwtRegex = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
console.log('✅ JWT format valid:', jwtRegex.test(testToken));

// Split and analyze parts
const parts = testToken.split('.');
console.log('\n🔍 JWT Parts Analysis:');
console.log('📦 Total parts:', parts.length);
console.log('📦 Header length:', parts[0]?.length || 0);
console.log('📦 Payload length:', parts[1]?.length || 0);
console.log('📦 Signature length:', parts[2]?.length || 0);

// Test verification
console.log('\n🔐 Testing token verification...');
try {
    const decoded = jwt.verify(testToken, JWT_SECRET);
    console.log('✅ Token verification successful:', decoded);
} catch (error) {
    console.log('❌ Token verification failed:', error.message);
    console.log('❌ Error type:', error.name);
}

// Test with Bearer prefix (simulating frontend)
console.log('\n🔍 Testing Bearer prefix handling...');
const authHeader = `Bearer ${testToken}`;
console.log('📝 Auth header:', authHeader);

const extractedToken = authHeader.split(' ')[1];
console.log('🔑 Extracted token matches:', extractedToken === testToken);

// Test with potentially corrupted tokens
console.log('\n🧪 Testing corrupted token scenarios...');

// Token with extra spaces
const spacedToken = ` ${testToken} `;
console.log('❌ Spaced token test:', spacedToken.trim() === testToken);

// Token with newlines
const newlineToken = `${testToken}\n`;
console.log('❌ Newline token test:', newlineToken.trim() === testToken);

console.log('\n🔍 JWT Debug Test Complete');
