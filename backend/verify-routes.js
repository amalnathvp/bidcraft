/**
 * Route Import Verification Script
 * Tests each route file to see which one is causing the Router middleware error
 */

console.log('🔍 ROUTE IMPORT VERIFICATION');
console.log('=' .repeat(40));

const routes = [
  { name: 'auth', path: './src/routes/auth' },
  { name: 'users', path: './src/routes/users' },
  { name: 'auctions', path: './src/routes/auctions' },
  { name: 'bids', path: './src/routes/bids' },
  { name: 'categories', path: './src/routes/categories' },
  { name: 'upload', path: './src/routes/upload' },
  { name: 'orderRoutes', path: './src/routes/orderRoutes' },
  { name: 'paymentRoutes', path: './src/routes/paymentRoutes' },
  { name: 'reviewRoutes', path: './src/routes/reviewRoutes' },
  { name: 'adminRoutes', path: './src/routes/adminRoutes' },
  { name: 'advancedAuctionRoutes', path: './src/routes/advancedAuctionRoutes' }
];

for (const route of routes) {
  try {
    console.log(`\n📄 Testing ${route.name}...`);
    const imported = require(route.path);
    
    if (typeof imported === 'function') {
      console.log(`✅ ${route.name} - Valid middleware function`);
    } else if (imported && typeof imported === 'object') {
      console.log(`✅ ${route.name} - Valid router object`);
    } else {
      console.log(`❌ ${route.name} - Invalid export: ${typeof imported}`);
    }
  } catch (error) {
    console.log(`❌ ${route.name} - Import error: ${error.message}`);
  }
}

console.log('\n' + '=' .repeat(40));
console.log('Route verification complete!');
console.log('Check for any ❌ entries above that may be causing the Router middleware error.');
