const { Issue, User, Vote } = require('../models');
const notificationService = require('../services/notificationService');
const { sequelize } = require('../config/database');

/**
 * @desc    Update issue status (admin only)
 * @route   PUT /api/admin/issues/:id/status
 * @access  Private/Admin
 */
exports.updateIssueStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const issue = await Issue.findByPk(req.params.id, {
            include: [{ model: User, as: 'reporter' }]
        });

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        const oldStatus = issue.status;
        issue.status = status;

        if (adminNotes) {
            issue.adminNotes = adminNotes;
        }

        if (status === 'verified' && !issue.isVerified) {
            issue.isVerified = true;
            issue.verifiedAt = new Date();
        }

        if (status === 'resolved') {
            issue.resolvedAt = new Date();
            // Increase reporter's reputation
            if (issue.reporter) {
                await issue.reporter.increment('reputationScore', { by: 10 });
            }
        }

        await issue.save();

        // Notify reporter
        if (issue.reporter) {
            await notificationService.notifyIssueStatusUpdate(issue.reporter, issue, status);
        }

        // Real-time: Emit status update event
        const io = req.app.get('io');
        if (io) {
            io.emit('issue_updated', {
                id: issue.id,
                title: issue.title,
                status: status,
                reporterId: issue.reporterId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Issue status updated',
            data: issue
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating issue status',
            error: error.message
        });
    }
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStatistics = async (req, res) => {
    try {
        const totalIssues = await Issue.count();
        const reportedIssues = await Issue.count({ where: { status: 'reported' } });
        const verifiedIssues = await Issue.count({ where: { status: 'verified' } });
        const inProgressIssues = await Issue.count({ where: { status: 'in_progress' } });
        const resolvedIssues = await Issue.count({ where: { status: 'resolved' } });
        const rejectedIssues = await Issue.count({ where: { status: 'rejected' } });

        const totalUsers = await User.count();
        const totalVotes = await Vote.count();

        // Issues by category
        const issuesByCategory = await Issue.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('category')), 'count']
            ],
            group: ['category']
        });

        // Recent issues
        const recentIssues = await Issue.findAll({
            include: [{ model: User, as: 'reporter', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalIssues,
                    reportedIssues,
                    verifiedIssues,
                    inProgressIssues,
                    resolvedIssues,
                    rejectedIssues,
                    totalUsers,
                    totalVotes
                },
                issuesByCategory,
                recentIssues
            }
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Delete issue (admin only)
 * @route   DELETE /api/admin/issues/:id
 * @access  Private/Admin
 */
exports.deleteIssue = async (req, res) => {
    try {
        const issue = await Issue.findByPk(req.params.id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        await issue.destroy();

        res.status(200).json({
            success: true,
            message: 'Issue deleted successfully'
        });
    } catch (error) {
        console.error('Delete issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting issue',
            error: error.message
        });
    }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};
