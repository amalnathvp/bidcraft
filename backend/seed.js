const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Auction = require('./src/models/Auction');
const Category = require('./src/models/Category');
const Bid = require('./src/models/Bid');
require('dotenv').config();

/**
 * Database seeder script to populate local MongoDB with sample data
 * This creates initial categories, users, auctions, and bids for development
 */

const sampleCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300'
  },
  {
    name: 'Art & Collectibles',
    description: 'Artwork, antiques, and collectible items',
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300'
  },
  {
    name: 'Fashion',
    description: 'Clothing, accessories, and fashion items',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300'
  },
  {
    name: 'Home & Garden',
    description: 'Home decor, furniture, and garden items',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300'
  },
  {
    name: 'Sports',
    description: 'Sports equipment and memorabilia',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300'
  }
];

const sampleUsers = [
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
  },
  {
    username: 'bob_wilson',
    email: 'bob@example.com',
    password: 'password123',
    firstName: 'Bob',
    lastName: 'Wilson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    username: 'alice_brown',
    email: 'alice@example.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Brown',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  }
];

const sampleAuctions = [
  {
    title: 'Vintage MacBook Pro 2019',
    description: 'Excellent condition MacBook Pro with original packaging. Barely used, perfect for students or professionals.',
    startingPrice: 800,
    currentPrice: 950,
    images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'],
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'active',
    categoryName: 'Electronics'
  },
  {
    title: 'Abstract Oil Painting',
    description: 'Original abstract oil painting by local artist. Vibrant colors and unique composition, perfect for modern homes.',
    startingPrice: 300,
    currentPrice: 420,
    images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400'],
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'active',
    categoryName: 'Art & Collectibles'
  },
  {
    title: 'Designer Leather Jacket',
    description: 'Genuine leather jacket from premium brand. Size M, black color, worn only few times.',
    startingPrice: 200,
    currentPrice: 280,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'],
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'active',
    categoryName: 'Fashion'
  },
  {
    title: 'Vintage Coffee Table',
    description: 'Mid-century modern coffee table in walnut wood. Some wear but structurally sound. Great character piece.',
    startingPrice: 150,
    currentPrice: 225,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    status: 'active',
    categoryName: 'Home & Garden'
  },
  {
    title: 'Signed Baseball Collection',
    description: 'Collection of 5 baseballs signed by major league players. Authenticated with certificates.',
    startingPrice: 500,
    currentPrice: 750,
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    status: 'active',
    categoryName: 'Sports'
  }
];

/**
 * Connect to MongoDB and seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcraft';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Auction.deleteMany({});
    await Category.deleteMany({});
    await Bid.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create users with hashed passwords
    console.log('👥 Creating users...');
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create auctions with category and seller references
    console.log('🏷️ Creating auctions...');
    const auctionsWithRefs = sampleAuctions.map((auction, index) => ({
      ...auction,
      category: createdCategories.find(cat => cat.name === auction.categoryName)._id,
      seller: createdUsers[index % createdUsers.length]._id
    }));
    
    const createdAuctions = await Auction.insertMany(auctionsWithRefs);
    console.log(`✅ Created ${createdAuctions.length} auctions`);

    // Create sample bids for each auction
    console.log('💰 Creating sample bids...');
    const sampleBids = [];
    
    createdAuctions.forEach((auction) => {
      const bidCount = Math.floor(Math.random() * 3) + 1; // 1-3 bids per auction
      const bidIncrement = (auction.currentPrice - auction.startingPrice) / bidCount;
      
      for (let i = 0; i < bidCount; i++) {
        const bidder = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        // Don't let seller bid on own auction
        if (bidder._id.toString() !== auction.seller.toString()) {
          sampleBids.push({
            auction: auction._id,
            bidder: bidder._id,
            amount: auction.startingPrice + (bidIncrement * (i + 1)),
            timestamp: new Date(Date.now() - (bidCount - i) * 60 * 60 * 1000) // Stagger bid times
          });
        }
      }
    });

    if (sampleBids.length > 0) {
      await Bid.insertMany(sampleBids);
      console.log(`✅ Created ${sampleBids.length} sample bids`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Auctions: ${createdAuctions.length}`);
    console.log(`   Bids: ${sampleBids.length}`);
    
    console.log('\n🔐 Test User Credentials:');
    sampleUsers.forEach(user => {
      console.log(`   Email: ${user.email} | Password: ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
