const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-issues';

console.log('Testing connection to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ HUGE SUCCESS: Connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ CONNECTION FAILED:', err.message);
        console.error('\nPOSSIBLE FIXES:');
        console.error('1. Make sure "mongod" (MongoDB Server) is running.');
        console.error('2. If using Docker, ensure Docker Desktop is open.');
        console.error('3. Check if something is blocking port 27017.');
        process.exit(1);
    });
