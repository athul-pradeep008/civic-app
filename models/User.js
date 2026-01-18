const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['citizen', 'admin'],
        default: 'citizen'
    },
    reputationScore: {
        type: Number,
        default: 0
    },
    issuesReported: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: function () {
            return `https://ui-avatars.com/api/?name=${this.username}&background=random&color=fff&size=256`;
        }
    },
    // Authentication Extensions
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    otp: {
        type: String,
        select: false // Do not return OTP in queries
    },
    otpExpires: {
        type: Date,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
