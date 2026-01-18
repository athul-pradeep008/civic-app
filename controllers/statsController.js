const Issue = require('../models/Issue');

/**
 * @desc    Get issue statistics for analytics
 * @route   GET /api/stats/overview
 * @access  Private
 */
exports.getOverviewStats = async (req, res) => {
    try {
        // 1. Distribution by Category
        const categoryStats = await Issue.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 2. Distribution by Status
        const statusStats = await Issue.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 3. Overall Totals
        const totalIssues = await Issue.countDocuments();
        const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });

        res.status(200).json({
            success: true,
            data: {
                categories: categoryStats,
                statuses: statusStats,
                totals: {
                    total: totalIssues,
                    resolved: resolvedIssues,
                    resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0
                }
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
