/**
 * Database Seeding Script for BidCraft
 * Seeds the MongoDB database with sample data for development and testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Auction = require('./src/models/Auction');
const Bid = require('./src/models/Bid');

// Sample categories data
const categoriesData = [
  {
    name: 'Pottery & Ceramics',
    slug: 'pottery-ceramics',
    description: 'Handcrafted bowls, vases, and decorative pieces',
    icon: 'fas fa-palette',
    featured: true,
    sortOrder: 1
  },
  {
    name: 'Textiles & Fabrics',
    slug: 'textiles-fabrics',
    description: 'Traditional weaving, embroidery, and tapestries',
    icon: 'fas fa-cut',
    featured: true,
    sortOrder: 2
  },
  {
    name: 'Wood Crafts',
    slug: 'wood-crafts',
    description: 'Carved sculptures, furniture, and decorative items',
    icon: 'fas fa-tree',
    featured: true,
    sortOrder: 3
  },
  {
    name: 'Jewelry & Accessories',
    slug: 'jewelry-accessories',
    description: 'Handmade jewelry and personal accessories',
    icon: 'fas fa-gem',
    featured: true,
    sortOrder: 4
  },
  {
    name: 'Metal Works',
    slug: 'metal-works',
    description: 'Forged items, sculptures, and decorative pieces',
    icon: 'fas fa-hammer',
    featured: true,
    sortOrder: 5
  },
  {
    name: 'Art & Paintings',
    slug: 'art-paintings',
    description: 'Original artworks and traditional paintings',
    icon: 'fas fa-brush',
    featured: true,
    sortOrder: 6
  },
  {
    name: 'Leather Goods',
    slug: 'leather-goods',
    description: 'Handmade leather bags, wallets, and accessories',
    icon: 'fas fa-briefcase',
    featured: false,
    sortOrder: 7
  },
  {
    name: 'Glass Works',
    slug: 'glass-works',
    description: 'Blown glass art and decorative pieces',
    icon: 'fas fa-wine-glass',
    featured: false,
    sortOrder: 8
  }
];

// Sample users data (sellers and buyers)
const usersData = [
  {
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    password: 'password123',
    role: 'seller',
    shopName: "Maria's Ceramic Studio",
    shopDescription: 'Traditional Portuguese ceramic artist with 20+ years of experience',
    sellerRating: 4.8,
    totalSales: 45,
    isVerified: true
  },
  {
    name: 'John Craftsman',
    email: 'john.craftsman@example.com',
    password: 'password123',
    role: 'seller',
    shopName: 'Woodworking Masters',
    shopDescription: 'Specializing in carved wooden sculptures and furniture',
    sellerRating: 4.9,
    totalSales: 32,
    isVerified: true
  },
  {
    name: 'Amira Hassan',
    email: 'amira.hassan@example.com',
    password: 'password123',
    role: 'seller',
    shopName: 'Heritage Textiles',
    shopDescription: 'Traditional Middle Eastern textiles and rugs',
    sellerRating: 4.7,
    totalSales: 28,
    isVerified: true
  },
  {
    name: 'David Chen',
    email: 'david.chen@example.com',
    password: 'password123',
    role: 'seller',
    shopName: 'Chen Jewelry',
    shopDescription: 'Handcrafted jewelry with Asian influences',
    sellerRating: 4.6,
    totalSales: 19,
    isVerified: true
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@example.com',
    password: 'password123',
    role: 'seller',
    shopName: 'Metalwork Artistry',
    shopDescription: 'Contemporary metal sculptures and decorative pieces',
    sellerRating: 4.5,
    totalSales: 15,
    isVerified: true
  },
  {
    name: 'Alice Cooper',
    email: 'alice.cooper@example.com',
    password: 'password123',
    role: 'buyer',
    isVerified: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    password: 'password123',
    role: 'buyer',
    isVerified: true
  },
  {
    name: 'Carol Williams',
    email: 'carol.williams@example.com',
    password: 'password123',
    role: 'buyer',
    isVerified: true
  },
  {
    name: 'Admin User',
    email: 'admin@bidcraft.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  }
];

// Sample auction images from Unsplash
const sampleImages = [
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1615397587950-3cfa537625fd?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop',
  'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&h=400&fit=crop'
];

// Function to generate auction data
const generateAuctionData = (sellers, categories) => {
  const auctions = [];
  const conditions = ['new', 'like-new', 'good', 'fair'];
  const materials = [
    ['ceramic', 'clay'],
    ['wood', 'oak', 'mahogany'],
    ['cotton', 'silk', 'wool'],
    ['silver', 'gold', 'copper'],
    ['glass', 'crystal'],
    ['leather', 'suede']
  ];

  const auctionTitles = [
    'Vintage Ceramic Vase with Blue Glaze',
    'Hand-Carved Wooden Elephant Sculpture',
    'Traditional Persian Rug - Authentic',
    'Sterling Silver Handmade Bracelet',
    'Blown Glass Art Bowl - Multicolor',
    'Leather Journal with Hand-Tooled Cover',
    'Ceramic Tea Set - 6 Pieces',
    'Wooden Chess Set - Hand Carved',
    'Silk Scarf with Traditional Patterns',
    'Copper Wall Art - Abstract Design',
    'Crystal Pendant Necklace',
    'Handwoven Wool Blanket',
    'Ceramic Planter Set',
    'Wooden Serving Tray - Rustic',
    'Embroidered Wall Hanging',
    'Silver Ring with Natural Stone',
    'Glass Candle Holders - Set of 3',
    'Leather Wallet - Handstitched',
    'Ceramic Coffee Mug Collection',
    'Carved Wooden Bowl Set'
  ];

  const descriptions = [
    'A beautiful piece showcasing traditional craftsmanship and attention to detail.',
    'Expertly crafted by skilled artisans using time-honored techniques.',
    'This unique item represents the finest in traditional handicraft artistry.',
    'Handmade with love and care, perfect for collectors and enthusiasts.',
    'A stunning example of cultural heritage preserved through skilled craftsmanship.',
    'Meticulously created using authentic methods passed down through generations.',
    'This exceptional piece combines functionality with artistic beauty.',
    'Crafted with premium materials and finished to the highest standards.',
    'A rare find that showcases the beauty of traditional handmade artistry.',
    'Perfect for those who appreciate authentic, handcrafted items.'
  ];

  for (let i = 0; i < 25; i++) {
    const seller = sellers[Math.floor(Math.random() * sellers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const startingPrice = Math.floor(Math.random() * 500) + 25;
    const additionalBids = Math.floor(Math.random() * 15);
    const currentPrice = startingPrice + (additionalBids * Math.floor(Math.random() * 25));
    
    // Random time for auction end (some ended, some active, some future)
    const now = new Date();
    const startTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Up to 7 days ago
    const duration = (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000; // 1-7 days
    const endTime = new Date(startTime.getTime() + duration);
    
    // Determine status based on timing
    let status = 'active';
    if (startTime > now) {
      status = 'scheduled';
    } else if (endTime < now) {
      status = Math.random() > 0.7 ? 'sold' : 'ended';
    }

    auctions.push({
      title: auctionTitles[i % auctionTitles.length] + ` #${i + 1}`,
      description: descriptions[Math.floor(Math.random() * descriptions.length)] + ' ' + 
                  descriptions[Math.floor(Math.random() * descriptions.length)],
      category: category._id,
      images: [{
        url: sampleImages[Math.floor(Math.random() * sampleImages.length)],
        alt: auctionTitles[i % auctionTitles.length]
      }],
      startingPrice: startingPrice,
      currentPrice: currentPrice,
      reservePrice: startingPrice + Math.floor(Math.random() * 100),
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      seller: seller._id,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      materials: materials[Math.floor(Math.random() * materials.length)],
      origin: {
        country: ['USA', 'India', 'Mexico', 'Peru', 'Morocco', 'Turkey'][Math.floor(Math.random() * 6)],
        artisan: seller.name
      },
      tags: ['handmade', 'authentic', 'traditional', 'unique'].slice(0, Math.floor(Math.random() * 4) + 1),
      status: status,
      totalBids: additionalBids,
      views: Math.floor(Math.random() * 200) + 10,
      featured: Math.random() > 0.7, // 30% chance of being featured
      shipping: {
        method: 'standard',
        cost: Math.floor(Math.random() * 20) + 5,
        freeShipping: Math.random() > 0.6,
        international: true,
        handlingTime: Math.floor(Math.random() * 3) + 1
      }
    });
  }

  return auctions;
};

// Function to generate bid data
const generateBidData = (auctions, buyers) => {
  const bids = [];
  
  auctions.forEach(auction => {
    if (auction.totalBids > 0) {
      for (let i = 0; i < auction.totalBids; i++) {
        const bidder = buyers[Math.floor(Math.random() * buyers.length)];
        const bidAmount = auction.startingPrice + (i + 1) * Math.floor(Math.random() * 25) + 5;
        
        bids.push({
          auction: auction._id,
          bidder: bidder._id,
          amount: bidAmount,
          bidTime: new Date(auction.startTime.getTime() + Math.random() * (auction.endTime - auction.startTime)),
          isMaxBid: Math.random() > 0.8, // 20% chance of being max bid
          status: i === auction.totalBids - 1 ? 'winning' : 'outbid'
        });
      }
    }
  });
  
  return bids;
};

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await Bid.deleteMany({});
    await Auction.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Seeded ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Hash passwords for all users
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );
    
    const users = await User.insertMany(hashedUsers);
    console.log(`✅ Seeded ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed auctions
const seedAuctions = async (sellers, categories) => {
  try {
    const auctionData = generateAuctionData(sellers, categories);
    const auctions = await Auction.insertMany(auctionData);
    console.log(`✅ Seeded ${auctions.length} auctions`);
    return auctions;
  } catch (error) {
    console.error('Error seeding auctions:', error);
    throw error;
  }
};

// Seed bids
const seedBids = async (auctions, buyers) => {
  try {
    const bidData = generateBidData(auctions, buyers);
    if (bidData.length > 0) {
      const bids = await Bid.insertMany(bidData);
      console.log(`✅ Seeded ${bids.length} bids`);
      return bids;
    }
    console.log('✅ No bids to seed');
    return [];
  } catch (error) {
    console.error('Error seeding bids:', error);
    throw error;
  }
};

// Update category auction counts
const updateCategoryCounts = async () => {
  try {
    const categories = await Category.find({});
    
    for (const category of categories) {
      const totalAuctions = await Auction.countDocuments({ category: category._id });
      const activeAuctions = await Auction.countDocuments({ 
        category: category._id, 
        status: { $in: ['active', 'scheduled'] }
      });
      
      await Category.findByIdAndUpdate(category._id, {
        totalAuctions,
        activeAuctions
      });
    }
    
    console.log('✅ Updated category auction counts');
  } catch (error) {
    console.error('Error updating category counts:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order (respecting dependencies)
    console.log('\n📦 Seeding categories...');
    const categories = await seedCategories();
    
    console.log('\n👥 Seeding users...');
    const users = await seedUsers();
    
    const sellers = users.filter(user => user.role === 'seller');
    const buyers = users.filter(user => user.role === 'buyer');
    
    console.log('\n🏛️  Seeding auctions...');
    const auctions = await seedAuctions(sellers, categories);
    
    console.log('\n💰 Seeding bids...');
    await seedBids(auctions, buyers);
    
    console.log('\n📊 Updating category counts...');
    await updateCategoryCounts();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📈 Seeding Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Users: ${users.length} (${sellers.length} sellers, ${buyers.length} buyers, 1 admin)`);
    console.log(`   Auctions: ${auctions.length}`);
    console.log('\n💡 You can now log in with:');
    console.log('   Seller: maria.santos@example.com / password123');
    console.log('   Buyer: alice.cooper@example.com / password123');
    console.log('   Admin: admin@bidcraft.com / admin123');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  categoriesData,
  usersData
};