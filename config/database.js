const mongoose = require('mongoose');
const config = require('./config');

let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

const connectDB = async () => {
    const mongoOptions = {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        connectTimeoutMS: 30000, // 30 seconds
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
        minPoolSize: 2,
        waitQueueTimeoutMS: 30000,
    };

    try {
        console.log(`🔄 Connecting to MongoDB (Attempt ${connectionAttempts + 1}/${MAX_RETRIES})...`);
        console.log(`📍 URI: ${config.mongoUri}`);

        const conn = await mongoose.connect(config.mongoUri, mongoOptions);
        const host = conn.connection.host || 'localhost';
        
        console.log(`\n✅ MongoDB Connected Successfully!`);
        console.log(`🖥️  Host: ${host}`);
        console.log(`📊 Database: ${conn.connection.db.databaseName}\n`);
        
        connectionAttempts = 0; // Reset on successful connection

        // Listen for connection events
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB Disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
        });

    } catch (error) {
        connectionAttempts++;
        
        console.error(`\n❌ MONGODB CONNECTION ERROR: ${error.message}`);
        console.error(`\n💡 Troubleshooting Steps:`);
        console.error(`   1. Ensure MongoDB is installed and running`);
        console.error(`   2. Check if MongoDB is running on port 27017`);
        console.error(`   3. Verify MONGODB_URI in your .env file`);
        console.error(`   4. Check your network connectivity`);
        console.error(`   5. Ensure MongoDB authentication credentials are correct\n`);

        if (connectionAttempts < MAX_RETRIES) {
            console.log(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...\n`);
            setTimeout(() => {
                connectDB();
            }, RETRY_DELAY);
        } else {
            console.error(`\n❌ FATAL: Failed to connect to MongoDB after ${MAX_RETRIES} attempts.`);
            console.error(`\n📋 Quick Start (Windows):`);
            console.error(`   1. Install MongoDB: https://www.mongodb.com/try/download/community`);
            console.error(`   2. Start MongoDB: mongod`);
            console.error(`   3. Restart this application\n`);
            
            if (config.nodeEnv === 'production') {
                process.exit(1);
            }
        }
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
        process.exit(1);
    }
});

module.exports = connectDB;
