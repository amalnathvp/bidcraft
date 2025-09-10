require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting MongoDB-connected backend server...');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidcraft';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('🗄️ Database:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('⚠️ Using fallback mock data instead of MongoDB');
});

// Auction schema to match MongoDB structure
const auctionSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: {
    _id: String,
    name: String,
    slug: String
  },
  currentPrice: Number,
  startingPrice: Number,
  totalBids: { type: Number, default: 0 },
  endTime: Date,
  startTime: Date,
  images: [{
    url: String,
    publicId: String,
    alt: String
  }],
  seller: {
    _id: String,
    name: String,
    shopName: String,
    rating: Number,
    totalSales: Number,
    location: String,
    memberSince: String,
    verified: Boolean
  },
  condition: String,
  status: { type: String, default: 'active' },
  watchers: [String],
  reservePrice: Number,
  buyNowPrice: Number,
  material: String,
  dimensions: String,
  weight: String,
  origin: String,
  authentication: String,
  era: String,
  subcategory: String,
  shipping: {
    cost: Number,
    time: String,
    international: Boolean,
    insurance: Boolean
  },
  specifications: [{
    label: String,
    value: String
  }]
}, { timestamps: true });

const Auction = mongoose.model('Auction', auctionSchema);

// Mock data to seed if no auctions exist
const mockAuctionData = {
  title: "Vintage Kashmiri Pashmina Shawl",
  description: "Exquisite hand-woven Kashmiri Pashmina shawl featuring intricate traditional patterns. This authentic piece showcases the finest craftsmanship from the Kashmir valley, made from 100% pure Pashmina wool. The shawl displays beautiful floral motifs in rich burgundy and gold threads, representing centuries-old weaving traditions.",
  category: {
    _id: "cat1",
    name: "Textiles",
    slug: "textiles"
  },
  currentPrice: 285,
  startingPrice: 150,
  totalBids: 8,
  endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  images: [
    {
      url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=400&fit=crop",
      publicId: "kashmiri-shawl-1",
      alt: "Vintage Kashmiri Pashmina Shawl"
    },
    {
      url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=400&fit=crop",
      publicId: "kashmiri-shawl-2",
      alt: "Detail view of Pashmina"
    },
    {
      url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      publicId: "kashmiri-shawl-3",
      alt: "Pattern close-up"
    }
  ],
  seller: {
    _id: "seller1",
    name: "KashmirCrafts",
    shopName: "Kashmir Authentic Crafts",
    rating: 4.9,
    totalSales: 156,
    location: "Srinagar, Kashmir",
    memberSince: "2019",
    verified: true
  },
  condition: "Excellent",
  status: "active",
  watchers: ["user1", "user2", "user3"],
  reservePrice: 200,
  buyNowPrice: 450,
  material: "100% Pashmina Wool",
  dimensions: "200cm x 70cm",
  weight: "150g",
  origin: "Kashmir, India",
  authentication: "Certified Authentic",
  era: "Contemporary (Post-1960)",
  subcategory: "Shawls & Wraps",
  shipping: {
    cost: 15,
    time: "3-5 business days",
    international: true,
    insurance: true
  },
  specifications: [
    { label: "Material", value: "100% Pashmina Wool" },
    { label: "Weave Type", value: "Traditional Hand-woven" },
    { label: "Pattern", value: "Floral Paisley" },
    { label: "Colors", value: "Burgundy, Gold, Cream" },
    { label: "Care Instructions", value: "Dry Clean Only" },
    { label: "Provenance", value: "Kashmir Valley Workshop" }
  ]
};

// Seed data if no auctions exist
const seedAuctions = async () => {
  try {
    const count = await Auction.countDocuments();
    if (count === 0) {
      console.log('📦 Seeding auction data...');
      
      // Create multiple auctions
      const auctions = [
        mockAuctionData,
        {
          ...mockAuctionData,
          title: "Handwoven Silk Textile",
          description: "Beautiful handwoven silk textile from traditional artisans with intricate patterns.",
          currentPrice: 150,
          startingPrice: 100,
          totalBids: 5,
          reservePrice: 120,
          buyNowPrice: 300,
          category: { _id: "cat1", name: "Textiles", slug: "textiles" },
          seller: { ...mockAuctionData.seller, name: "SilkMasters", shopName: "Traditional Silk Crafts" }
        },
        {
          ...mockAuctionData,
          title: "Ceramic Pottery Bowl",
          description: "Hand-thrown ceramic bowl with traditional glazing techniques.",
          currentPrice: 85,
          startingPrice: 50,
          totalBids: 12,
          reservePrice: 75,
          buyNowPrice: 180,
          category: { _id: "cat2", name: "Pottery & Ceramics", slug: "pottery" },
          material: "Ceramic Clay",
          dimensions: "15cm diameter x 8cm height",
          weight: "300g",
          seller: { ...mockAuctionData.seller, name: "ClayWorks", shopName: "Artisan Pottery Studio" }
        }
      ];
      
      await Auction.insertMany(auctions);
      console.log('✅ Auction data seeded successfully');
    } else {
      console.log(`📊 Found ${count} existing auctions in database`);
    }
  } catch (error) {
    console.error('❌ Error seeding auction data:', error);
  }
};

// Routes
app.get('/api/auctions', async (req, res) => {
  try {
    console.log('📡 GET /api/auctions - Fetching from MongoDB');
    
    const { category, sortBy = 'endTime', sortOrder = 'asc' } = req.query;
    
    let query = { status: 'active' };
    if (category && category !== 'all') {
      query['category.slug'] = category;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const auctions = await Auction.find(query).sort(sortOptions).limit(50);
    
    console.log(`✅ Found ${auctions.length} auctions`);
    
    res.json({
      success: true,
      data: auctions,
      count: auctions.length
    });
  } catch (error) {
    console.error('❌ Error fetching auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
});

app.get('/api/auctions/:id', async (req, res) => {
  try {
    console.log(`📡 GET /api/auctions/${req.params.id} - Fetching single auction from MongoDB`);
    
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }
    
    console.log('✅ Auction found:', auction.title);
    
    // Add computed fields for frontend compatibility
    const auctionData = auction.toObject();
    auctionData.currentBid = auction.currentPrice;
    auctionData.startingBid = auction.startingPrice;
    auctionData.bidCount = auction.totalBids;
    
    // Calculate time remaining
    const now = new Date();
    const end = new Date(auction.endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      auctionData.timeLeft = `${days}d ${hours}h ${minutes}m`;
    } else {
      auctionData.timeLeft = "Ended";
    }
    
    auctionData.endDate = auction.endTime.toISOString();
    
    res.json({
      success: true,
      data: auctionData
    });
  } catch (error) {
    console.error('❌ Error fetching auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    success: true,
    message: 'BidCraft MongoDB API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 MongoDB API server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Auctions API: http://localhost:${PORT}/api/auctions`);
  
  // Seed data after server starts
  await seedAuctions();
  console.log('✅ Ready to serve AuctionDetail.tsx requests');
});

server.on('error', (error) => {
  console.error('💥 Server failed to start:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('🗄️ MongoDB connection closed');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('👋 Shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('🗄️ MongoDB connection closed');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});
