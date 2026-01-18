const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voteType: {
        type: String,
        enum: ['upvote', 'downvote'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only vote once per issue
voteSchema.index({ issue: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
