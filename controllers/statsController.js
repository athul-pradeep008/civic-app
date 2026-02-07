const { Issue } = require('../models');
const { sequelize } = require('../config/database');

/**
 * @desc    Get issue statistics for analytics
 * @route   GET /api/stats/overview
 * @access  Private
 */
exports.getOverviewStats = async (req, res) => {
    try {
        // 1. Distribution by Category
        const categoryStats = await Issue.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('category')), 'count']
            ],
            group: ['category'],
            order: [[sequelize.literal('count'), 'DESC']]
        });

        // 2. Distribution by Status
        // SQLite might not support complex aggregations easily without raw queries, 
        // but simple GROUP BY works fine with Sequelize
        const statusStats = await Issue.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status'],
            order: [[sequelize.literal('count'), 'DESC']]
        });

        // 3. Overall Totals
        const totalIssues = await Issue.count();
        const resolvedIssues = await Issue.count({ where: { status: 'resolved' } });

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
