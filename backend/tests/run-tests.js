/**
 * Test Runner Script
 * Runs all API and Socket.io tests for BidCraft backend
 * 
 * Usage: node run-tests.js [options]
 * Options:
 *   --api-only     Run only API tests
 *   --socket-only  Run only Socket.io tests
 *   --quick        Run essential tests only
 */

const { runAllTests } = require('./api-test-suite');
const { runSocketTests } = require('./socket-test');

// Configuration
const args = process.argv.slice(2);
const options = {
  apiOnly: args.includes('--api-only'),
  socketOnly: args.includes('--socket-only'),
  quick: args.includes('--quick')
};

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('🚀 BIDCRAFT BACKEND TEST RUNNER', 'magenta');
  log('=' .repeat(50), 'blue');
  
  const startTime = Date.now();
  
  try {
    if (!options.socketOnly) {
      log('\n📡 Running API Tests...', 'cyan');
      await runAllTests();
    }
    
    if (!options.apiOnly) {
      log('\n⚡ Running Socket.io Tests...', 'cyan');
      await runSocketTests();
    }
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n' + '=' .repeat(50), 'blue');
    log('🏁 ALL TESTS COMPLETED', 'green');
    log(`⏱️  Total Runtime: ${totalTime}s`, 'yellow');
    log('=' .repeat(50), 'blue');
    
  } catch (error) {
    log('\n💥 Test runner crashed:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  log('BidCraft Backend Test Runner', 'cyan');
  log('');
  log('Usage: node run-tests.js [options]', 'yellow');
  log('');
  log('Options:', 'blue');
  log('  --api-only     Run only API tests');
  log('  --socket-only  Run only Socket.io tests');
  log('  --quick        Run essential tests only');
  log('  --help, -h     Show this help message');
  log('');
  log('Examples:', 'green');
  log('  node run-tests.js                 # Run all tests');
  log('  node run-tests.js --api-only      # API tests only');
  log('  node run-tests.js --socket-only   # Socket.io tests only');
  process.exit(0);
}

// Check prerequisites
async function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5000/health');
    
    if (response.ok) {
      log('✅ Backend server is running', 'green');
      return true;
    } else {
      log('❌ Backend server not responding', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Cannot connect to backend server', 'red');
    log('   Make sure the server is running on http://localhost:5000', 'yellow');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkPrerequisites();
  
  if (!serverRunning) {
    log('\n⚠️  Please start the backend server before running tests:', 'yellow');
    log('   cd backend && npm start', 'cyan');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);
