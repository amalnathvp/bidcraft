const mongoose = require('mongoose');

console.log('Testing Order model import...');
console.log('Mongoose version:', mongoose.version);

try {
    console.log('About to require Order model...');
    const Order = require('./src/models/Order');
    console.log('✅ Order model imported successfully');
    console.log('Order:', Order);
    console.log('Order type:', typeof Order);
    console.log('Order constructor name:', Order.constructor.name);
    console.log('Order.findById type:', typeof Order.findById);
    
    // Check if it's a function (mongoose model)
    if (typeof Order === 'function') {
        console.log('Order is a function (mongoose model)');
        console.log('Order.prototype:', Object.getOwnPropertyNames(Order.prototype));
    }
    
    // List all registered mongoose models
    console.log('Registered mongoose models:', Object.keys(mongoose.models));
    
} catch (error) {
    console.error('❌ Error importing Order model:', error);
    console.error('Stack trace:', error.stack);
}
