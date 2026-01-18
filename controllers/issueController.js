const Issue = require('../models/Issue');
const User = require('../models/User');
const verificationService = require('../services/verificationService');
const notificationService = require('../services/notificationService');
const fs = require('fs').promises;
const path = require('path');

/**
 * @desc    Create new issue
 * @route   POST /api/issues
 * @access  Private
 */
exports.createIssue = async (req, res) => {
    try {
        const { title, description, category, location, address, priority } = req.body;

        // Parse location if it's a string
        const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

        // Validate location
        const locationValidation = verificationService.validateLocation(parsedLocation.coordinates);
        if (!locationValidation.valid) {
            return res.status(400).json({
                success: false,
                message: locationValidation.message
            });
        }

        // Check for spam
        const isSpam = await verificationService.detectSpam(req.user.id);
        if (isSpam) {
            return res.status(429).json({
                success: false,
                message: 'Too many issues reported. Please slow down.'
            });
        }

        // Check for duplicates
        const duplicateCheck = await verificationService.checkDuplicates(
            parsedLocation,
            category,
            title
        );

        // Process uploaded images
        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                images.push({
                    filename: file.filename,
                    path: file.path
                });
            }
        }

        // Create issue
        const issue = await Issue.create({
            title,
            description,
            category,
            location: parsedLocation,
            address,
            priority: priority || 'medium',
            images,
            reporter: req.user.id,
            isDuplicate: duplicateCheck.isDuplicate,
            duplicateOf: duplicateCheck.isDuplicate ? duplicateCheck.duplicateIssues[0]?._id : null
        });

        // Update user's reported issues
        await User.findByIdAndUpdate(req.user.id, {
            $push: { issuesReported: issue._id }
        });

        // Notify admin
        await notificationService.notifyAdminNewIssue(issue);

        // Real-time: Emit new issue event
        const io = req.app.get('io');
        io.emit('new_issue', {
            title: issue.title,
            category: issue.category,
            reporter: req.user.username,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: issue,
            duplicateWarning: duplicateCheck.isDuplicate ? 'Similar issues found nearby' : null,
            duplicateIssues: duplicateCheck.duplicateIssues
        });
    } catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating issue',
            error: error.message
        });
    }
};

/**
 * @desc    Get all issues with filtering
 * @route   GET /api/issues
 * @access  Public
 */
exports.getIssues = async (req, res) => {
    try {
        const { category, status, priority, search, limit = 50, page = 1 } = req.query;

        // Build query
        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const issues = await Issue.find(query)
            .populate('reporter', 'username reputationScore')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Issue.countDocuments(query);

        res.status(200).json({
            success: true,
            count: issues.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: issues
        });
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching issues',
            error: error.message
        });
    }
};

/**
 * @desc    Get single issue
 * @route   GET /api/issues/:id
 * @access  Public
 */
exports.getIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('reporter', 'username email reputationScore')
            .populate('duplicateOf', 'title status');

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error('Get issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching issue',
            error: error.message
        });
    }
};

/**
 * @desc    Get nearby issues
 * @route   GET /api/issues/nearby/:longitude/:latitude
 * @access  Public
 */
exports.getNearbyIssues = async (req, res) => {
    try {
        const { longitude, latitude } = req.params;
        const { maxDistance = 5000, category, status } = req.query; // Default 5km

        const query = {
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        };

        if (category) query.category = category;
        if (status) query.status = status;

        const issues = await Issue.find(query)
            .populate('reporter', 'username reputationScore')
            .limit(50);

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });
    } catch (error) {
        console.error('Get nearby issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby issues',
            error: error.message
        });
    }
};

/**
 * @desc    Update issue
 * @route   PUT /api/issues/:id
 * @access  Private (Owner only)
 */
exports.updateIssue = async (req, res) => {
    try {
        let issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        // Check ownership
        if (issue.reporter.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this issue'
            });
        }

        // Only allow updating certain fields
        const { title, description, priority } = req.body;
        const updateData = {};

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (priority) updateData.priority = priority;

        issue = await Issue.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error('Update issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating issue',
            error: error.message
        });
    }
};

/**
 * @desc    Delete issue
 * @route   DELETE /api/issues/:id
 * @access  Private (Owner or Admin)
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

        // Check ownership
        if (issue.reporter.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this issue'
            });
        }

        // Delete associated images
        for (const image of issue.images) {
            try {
                await fs.unlink(image.path);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
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
