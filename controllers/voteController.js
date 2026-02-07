const { Vote, Issue } = require('../models');
const verificationService = require('../services/verificationService');

/**
 * @desc    Vote on an issue (upvote or downvote)
 * @route   POST /api/votes/:issueId
 * @access  Private
 */
exports.voteIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { voteType } = req.body; // 'upvote' or 'downvote'

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vote type. Must be "upvote" or "downvote"'
            });
        }

        // Check if issue exists
        const issue = await Issue.findByPk(issueId);
        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        // Check if user already voted
        const existingVote = await Vote.findOne({
            where: {
                issueId: issueId,
                userId: req.user.id
            }
        });

        if (existingVote) {
            // If same vote type, remove vote
            if (existingVote.voteType === voteType) {
                await existingVote.destroy();

                // Update issue vote count
                if (voteType === 'upvote') {
                    issue.upvotes = Math.max(0, issue.upvotes - 1);
                } else {
                    issue.downvotes = Math.max(0, issue.downvotes - 1);
                }

                await issue.save();

                return res.status(200).json({
                    success: true,
                    message: 'Vote removed',
                    data: { upvotes: issue.upvotes, downvotes: issue.downvotes }
                });
            } else {
                // Change vote type
                existingVote.voteType = voteType;
                await existingVote.save();

                // Update issue vote counts
                if (voteType === 'upvote') {
                    issue.upvotes += 1;
                    issue.downvotes = Math.max(0, issue.downvotes - 1);
                } else {
                    issue.downvotes += 1;
                    issue.upvotes = Math.max(0, issue.upvotes - 1);
                }
            }
        } else {
            // Create new vote
            await Vote.create({
                issueId: issueId,
                userId: req.user.id,
                voteType
            });

            // Update issue vote count
            if (voteType === 'upvote') {
                issue.upvotes += 1;
            } else {
                issue.downvotes += 1;
            }
        }

        // Calculate verification score
        issue.verificationScore = verificationService.calculateVerificationScore(issue);

        // Check if should auto-verify
        if (!issue.isVerified && verificationService.shouldAutoVerify(issue)) {
            issue.isVerified = true;
            issue.verifiedAt = new Date();
            issue.status = 'verified';
        }

        await issue.save();

        res.status(200).json({
            success: true,
            message: 'Vote recorded',
            data: {
                upvotes: issue.upvotes,
                downvotes: issue.downvotes,
                verificationScore: issue.verificationScore,
                isVerified: issue.isVerified
            }
        });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording vote',
            error: error.message
        });
    }
};

/**
 * @desc    Get user's vote on an issue
 * @route   GET /api/votes/:issueId
 * @access  Private
 */
exports.getUserVote = async (req, res) => {
    try {
        const { issueId } = req.params;

        const vote = await Vote.findOne({
            where: {
                issueId: issueId,
                userId: req.user.id
            }
        });

        res.status(200).json({
            success: true,
            data: vote ? { voteType: vote.voteType } : null
        });
    } catch (error) {
        console.error('Get vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vote',
            error: error.message
        });
    }
};
