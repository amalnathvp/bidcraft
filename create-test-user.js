const mongoose = require('mongoose');
const User = require('./backend/src/models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/bidcraft';

async function createTestUser() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if user already exists
        let user = await User.findOne({ email: 'test@example.com' });
        
        if (user) {
            console.log('👤 Test user already exists:', user.email);
        } else {
            console.log('📝 Creating test user...');
            user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Test123',
                role: 'admin',
                isVerified: true,
                isActive: true
            });
            console.log('✅ Test user created:', user.email);
        }

        console.log('👤 User details:', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestUser();
