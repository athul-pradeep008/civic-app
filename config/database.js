const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        const host = conn.connection.host || 'localhost';
        console.log(`✅ MongoDB Connected: ${host}`);

        // Mongoose will handle index creation via schemas
        // mongoose.connection.db.collection('issues').createIndex({ location: '2dsphere' });

    } catch (error) {
        console.error(`\n❌ MONGODB ERROR: ${error.message}`);
        console.error(`💡 Ensure MongoDB is installed and running locally on port 27017.`);
        console.error(`🔗 Or provided a MONGODB_URI in your .env file.\n`);
        // Don't exit immediately in development to let the user see the error
        if (config.nodeEnv === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
