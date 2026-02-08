const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite dialect
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false, // Set to console.log to see SQL queries
    retry: {
        match: [
            /SQLITE_BUSY/,
        ],
        name: 'query',
        max: 5
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ SQLite Database Connected Successfully.');

        // Import models to ensure they are registered
        require('../models');

        // Sync models (create tables if they don't exist)
        // In production, you might want to use migrations instead
        await sequelize.sync();
        console.log('✅ Models Synced.');

    } catch (error) {
        console.error('❌ Unable to connect to the SQLite database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
