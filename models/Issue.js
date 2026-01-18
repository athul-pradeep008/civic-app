const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: [
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
        ]
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String,
        required: [true, 'Please provide an address']
    },
    images: [{
        filename: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['reported', 'verified', 'in_progress', 'resolved', 'rejected'],
        default: 'reported'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    verificationScore: {
        type: Number,
        default: 0
    },
    isDuplicate: {
        type: Boolean,
        default: false
    },
    duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    resolvedAt: Date,
    adminNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Update timestamp on save
issueSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Issue', issueSchema);
