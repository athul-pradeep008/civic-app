const { User } = require('../models');

/**
 * @desc    Get leaderboard (top 10 users by reputation)
 * @route   GET /api/users/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: 'citizen' },
            order: [['reputationScore', 'DESC']],
            limit: 10,
            attributes: ['username', 'reputationScore']
        });

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
