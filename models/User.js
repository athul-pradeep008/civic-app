const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('citizen', 'admin'),
        defaultValue: 'citizen'
    },
    reputationScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    profileImage: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            if (!user.profileImage && user.username) {
                user.profileImage = `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=256`;
            }
        }
    }
});

// Instance method to compare password
User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Start: Helper to generate JWT
User.prototype.getSignedJwtToken = function () {
    return jwt.sign({ id: this.id }, config.jwtSecret, {
        expiresIn: config.jwtExpire
    });
};

module.exports = User;
