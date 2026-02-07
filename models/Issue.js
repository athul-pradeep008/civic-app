const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Issue = sequelize.define('Issue', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [1, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 1000]
        }
    },
    category: {
        type: DataTypes.ENUM(
            'pothole',
            'streetlight',
            'garbage',
            'drainage',
            'water_supply',
            'road_damage',
            'traffic_signal',
            'park_maintenance',
            'graffiti',
            'other'
        ),
        allowNull: false
    },
    // Location: storing as simple lat/lng for SQLite
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    images: {
        type: DataTypes.JSON, // Store images array as JSON string
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('reported', 'verified', 'in_progress', 'resolved', 'rejected'),
        defaultValue: 'reported'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
    },
    upvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    verificationScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isDuplicate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    duplicateOfId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verifiedAt: DataTypes.DATE,
    resolvedAt: DataTypes.DATE,
    adminNotes: DataTypes.TEXT,
    reporterId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Issue;
