const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vote = sequelize.define('Vote', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    voteType: {
        type: DataTypes.ENUM('upvote', 'downvote'),
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    issueId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Vote;
