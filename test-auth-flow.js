const mongoose = require('mongoose');
const User = require('./backend/src/models/User');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/bidcraft';
const JWT_SECRET = 'your_super_secret_jwt_key_here_change_in_production_make_it_very_long_and_random';

async function testAuth() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a user to test with
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No users found in database');
            return;
        }

        console.log('👤 Found user:', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
        });

        // Generate a token for this user
        console.log('\n🔑 Generating JWT token...');
        const token = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Token generated:', token);
        console.log('📏 Token length:', token.length);

        // Verify the token
        console.log('\n🔐 Verifying token...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified:', decoded);

        // Test the token against our user
        const foundUser = await User.findById(decoded.id).select('-password');
        console.log('👤 User lookup from token:', foundUser ? 'Success' : 'Failed');
        
        if (foundUser) {
            console.log('✅ Full auth flow test successful');
        } else {
            console.log('❌ Auth flow failed at user lookup');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testAuth();
