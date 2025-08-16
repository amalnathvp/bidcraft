const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

// Sample categories data
const categories = [
  {
    name: 'Pottery & Ceramics',
    description: 'Handcrafted pottery, ceramics, and clay items',
    icon: 'pottery',
    featured: true,
    sortOrder: 1,
    subcategories: [
      { name: 'Vases', slug: 'vases', description: 'Decorative and functional vases' },
      { name: 'Bowls', slug: 'bowls', description: 'Handmade ceramic bowls' },
      { name: 'Plates', slug: 'plates', description: 'Ceramic and pottery plates' },
      { name: 'Mugs & Cups', slug: 'mugs-cups', description: 'Coffee mugs and tea cups' }
    ],
    attributes: [
      { name: 'Material', type: 'select', options: ['Clay', 'Porcelain', 'Stoneware', 'Earthenware'], required: true },
      { name: 'Firing Temperature', type: 'select', options: ['Low-fire', 'Mid-fire', 'High-fire'] },
      { name: 'Glaze Type', type: 'text' },
      { name: 'Dishwasher Safe', type: 'boolean' }
    ]
  },
  {
    name: 'Textiles & Fiber Arts',
    description: 'Handwoven textiles, embroidery, and fiber crafts',
    icon: 'textile',
    featured: true,
    sortOrder: 2,
    subcategories: [
      { name: 'Tapestries', slug: 'tapestries', description: 'Woven wall hangings and tapestries' },
      { name: 'Rugs & Carpets', slug: 'rugs-carpets', description: 'Handwoven rugs and carpets' },
      { name: 'Clothing', slug: 'clothing', description: 'Handmade clothing and garments' },
      { name: 'Bags & Purses', slug: 'bags-purses', description: 'Handcrafted bags and accessories' }
    ],
    attributes: [
      { name: 'Fiber Type', type: 'select', options: ['Cotton', 'Wool', 'Silk', 'Linen', 'Synthetic'], required: true },
      { name: 'Weaving Technique', type: 'text' },
      { name: 'Care Instructions', type: 'text' },
      { name: 'Size', type: 'text', required: true }
    ]
  },
  {
    name: 'Woodworking',
    description: 'Carved and crafted wooden items',
    icon: 'wood',
    featured: true,
    sortOrder: 3,
    subcategories: [
      { name: 'Furniture', slug: 'furniture', description: 'Handcrafted wooden furniture' },
      { name: 'Sculptures', slug: 'sculptures', description: 'Wooden sculptures and art pieces' },
      { name: 'Bowls & Utensils', slug: 'bowls-utensils', description: 'Wooden kitchen and dining items' },
      { name: 'Decorative Items', slug: 'decorative-items', description: 'Decorative wooden crafts' }
    ],
    attributes: [
      { name: 'Wood Type', type: 'select', options: ['Oak', 'Pine', 'Mahogany', 'Teak', 'Bamboo', 'Other'], required: true },
      { name: 'Finish', type: 'select', options: ['Natural', 'Stained', 'Painted', 'Lacquered'] },
      { name: 'Handmade', type: 'boolean', required: true },
      { name: 'Assembly Required', type: 'boolean' }
    ]
  },
  {
    name: 'Metalwork',
    description: 'Forged, cast, and crafted metal items',
    icon: 'metal',
    featured: false,
    sortOrder: 4,
    subcategories: [
      { name: 'Jewelry', slug: 'jewelry', description: 'Handcrafted metal jewelry' },
      { name: 'Tools', slug: 'tools', description: 'Handforged tools and implements' },
      { name: 'Decorative Items', slug: 'decorative-items', description: 'Metal art and decoration' },
      { name: 'Functional Items', slug: 'functional-items', description: 'Everyday metal objects' }
    ],
    attributes: [
      { name: 'Metal Type', type: 'select', options: ['Iron', 'Steel', 'Bronze', 'Copper', 'Silver', 'Gold'], required: true },
      { name: 'Technique', type: 'select', options: ['Forged', 'Cast', 'Welded', 'Hammered'] },
      { name: 'Finish', type: 'text' },
      { name: 'Tarnish Resistant', type: 'boolean' }
    ]
  },
  {
    name: 'Glass Art',
    description: 'Blown, fused, and crafted glass items',
    icon: 'glass',
    featured: false,
    sortOrder: 5,
    subcategories: [
      { name: 'Vases', slug: 'vases', description: 'Glass vases and vessels' },
      { name: 'Sculptures', slug: 'sculptures', description: 'Glass art sculptures' },
      { name: 'Functional Items', slug: 'functional-items', description: 'Glassware and functional pieces' },
      { name: 'Ornaments', slug: 'ornaments', description: 'Decorative glass ornaments' }
    ],
    attributes: [
      { name: 'Glass Type', type: 'select', options: ['Blown Glass', 'Fused Glass', 'Stained Glass', 'Cast Glass'], required: true },
      { name: 'Color', type: 'text' },
      { name: 'Fragile', type: 'boolean', required: true },
      { name: 'Artist Signed', type: 'boolean' }
    ]
  },
  {
    name: 'Jewelry & Accessories',
    description: 'Handcrafted jewelry and personal accessories',
    icon: 'jewelry',
    featured: true,
    sortOrder: 6,
    subcategories: [
      { name: 'Necklaces', slug: 'necklaces', description: 'Handmade necklaces' },
      { name: 'Earrings', slug: 'earrings', description: 'Artisan earrings' },
      { name: 'Bracelets', slug: 'bracelets', description: 'Handcrafted bracelets' },
      { name: 'Rings', slug: 'rings', description: 'Artisan rings' }
    ],
    attributes: [
      { name: 'Material', type: 'select', options: ['Silver', 'Gold', 'Copper', 'Beads', 'Leather', 'Stone'], required: true },
      { name: 'Size', type: 'text' },
      { name: 'Adjustable', type: 'boolean' },
      { name: 'Gemstones', type: 'text' }
    ]
  },
  {
    name: 'Basketry & Weaving',
    description: 'Traditional baskets and woven items',
    icon: 'basket',
    featured: false,
    sortOrder: 7,
    subcategories: [
      { name: 'Storage Baskets', slug: 'storage-baskets', description: 'Functional storage baskets' },
      { name: 'Decorative Baskets', slug: 'decorative-baskets', description: 'Ornamental woven baskets' },
      { name: 'Mats & Placemats', slug: 'mats-placemats', description: 'Woven mats and table settings' },
      { name: 'Hats & Accessories', slug: 'hats-accessories', description: 'Woven hats and accessories' }
    ],
    attributes: [
      { name: 'Material', type: 'select', options: ['Bamboo', 'Rattan', 'Reed', 'Grass', 'Palm'], required: true },
      { name: 'Weaving Pattern', type: 'text' },
      { name: 'Waterproof', type: 'boolean' },
      { name: 'Indoor/Outdoor Use', type: 'select', options: ['Indoor', 'Outdoor', 'Both'] }
    ]
  }
];

// Sample admin user
const adminUser = {
  name: 'BidCraft Admin',
  email: 'admin@bidcraft.com',
  password: 'admin123',
  role: 'admin',
  isVerified: true,
  isActive: true
};

// Sample seller users
const sellerUsers = [
  {
    name: 'Maria Rodriguez',
    email: 'maria@pottery.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true,
    isActive: true,
    shopName: 'Maria\'s Pottery Studio',
    shopDescription: 'Traditional handcrafted pottery with modern designs',
    sellerRating: 4.8,
    totalSales: 15
  },
  {
    name: 'David Chen',
    email: 'david@woodcraft.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true,
    isActive: true,
    shopName: 'Chen Woodworking',
    shopDescription: 'Custom wooden furniture and decorative pieces',
    sellerRating: 4.9,
    totalSales: 22
  },
  {
    name: 'Sarah Williams',
    email: 'sarah@textiles.com',
    password: 'seller123',
    role: 'seller',
    isVerified: true,
    isActive: true,
    shopName: 'Woven Dreams',
    shopDescription: 'Handwoven textiles and fiber art',
    sellerRating: 4.7,
    totalSales: 18
  }
];

// Sample buyer users
const buyerUsers = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Emma Johnson',
    email: 'emma@example.com',
    password: 'buyer123',
    role: 'buyer',
    isVerified: true,
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcraft');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Seed categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Seed users
    const allUsers = [adminUser, ...sellerUsers, ...buyerUsers];
    const createdUsers = await User.insertMany(allUsers);
    console.log(`Created ${createdUsers.length} users`);

    console.log('\n=== SEEDED DATA ===');
    console.log('Admin User:');
    console.log('Email: admin@bidcraft.com');
    console.log('Password: admin123');
    
    console.log('\nSeller Users:');
    sellerUsers.forEach(seller => {
      console.log(`Email: ${seller.email}, Password: seller123, Shop: ${seller.shopName}`);
    });
    
    console.log('\nBuyer Users:');
    buyerUsers.forEach(buyer => {
      console.log(`Email: ${buyer.email}, Password: buyer123`);
    });

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
