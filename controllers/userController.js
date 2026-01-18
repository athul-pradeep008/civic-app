const User = require('../models/User');

/**
 * @desc    Get leaderboard (top 10 users by reputation)
 * @route   GET /api/users/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find({ role: 'citizen' }) // Filter admins if needed
            .sort({ reputationScore: -1 })
            .limit(10)
            .select('username reputationScore'); // Only send necessary data

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard'
        });
    }
};
