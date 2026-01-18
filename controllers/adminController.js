const Issue = require('../models/Issue');
const User = require('../models/User');
const Vote = require('../models/Vote');
const notificationService = require('../services/notificationService');

/**
 * @desc    Update issue status (admin only)
 * @route   PUT /api/admin/issues/:id/status
 * @access  Private/Admin
 */
exports.updateIssueStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const issue = await Issue.findById(req.params.id).populate('reporter');

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
            issue.verifiedAt = Date.now();
        }

        if (status === 'resolved') {
            issue.resolvedAt = Date.now();
            // Increase reporter's reputation
            await User.findByIdAndUpdate(issue.reporter._id, {
                $inc: { reputationScore: 10 }
            });
        }

        await issue.save();

        // Notify reporter
        await notificationService.notifyIssueStatusUpdate(issue.reporter, issue, status);

        // Real-time: Emit status update event
        const io = req.app.get('io');
        io.emit('issue_updated', {
            id: issue._id,
            title: issue.title,
            status: status,
            reporterId: issue.reporter._id
        });

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
        const totalIssues = await Issue.countDocuments();
        const reportedIssues = await Issue.countDocuments({ status: 'reported' });
        const verifiedIssues = await Issue.countDocuments({ status: 'verified' });
        const inProgressIssues = await Issue.countDocuments({ status: 'in_progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
        const rejectedIssues = await Issue.countDocuments({ status: 'rejected' });

        const totalUsers = await User.countDocuments();
        const totalVotes = await Vote.countDocuments();

        // Issues by category
        const issuesByCategory = await Issue.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent issues
        const recentIssues = await Issue.find()
            .populate('reporter', 'username')
            .sort({ createdAt: -1 })
            .limit(10);

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
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        await issue.deleteOne();

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
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

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
