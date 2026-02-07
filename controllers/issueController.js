const { Issue, User } = require('../models');
const verificationService = require('../services/verificationService');
const notificationService = require('../services/notificationService');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const { getDistance } = require('geolib');

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
        let images = [];
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
            location: parsedLocation, // Removed, but we use logic below
            latitude: parsedLocation.coordinates[1],
            longitude: parsedLocation.coordinates[0],
            address,
            priority: priority || 'medium',
            images,
            reporterId: req.user.id,
            isDuplicate: duplicateCheck.isDuplicate,
            duplicateOfId: duplicateCheck.isDuplicate ? duplicateCheck.duplicateIssues[0]?.id : null
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
        const where = {};

        if (category) where.category = category;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } }
            ];
        }

        // Execute query with pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Issue.findAndCountAll({
            where,
            include: [
                { model: User, as: 'reporter', attributes: ['username', 'reputationScore'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            success: true,
            count: rows.length,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / parseInt(limit)),
            data: rows
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
        const issue = await Issue.findByPk(req.params.id, {
            include: [
                { model: User, as: 'reporter', attributes: ['username', 'email', 'reputationScore'] },
                { model: Issue, as: 'duplicateOf', attributes: ['title', 'status'] }
            ]
        });

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
        const { maxDistance = 5000, category, status } = req.query;

        const where = {};
        if (category) where.category = category;
        if (status) where.status = status;

        // Optimization: We could use bounding box here, but for simplicity fetch all matches
        // and filter in memory. For production with millions of rows, use bounding box.
        const issues = await Issue.findAll({
            where,
            include: [{ model: User, as: 'reporter', attributes: ['username', 'reputationScore'] }]
        });

        const nearbyIssues = issues.filter(issue => {
            const dist = getDistance(
                { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                { latitude: issue.latitude, longitude: issue.longitude }
            );
            return dist <= parseInt(maxDistance);
        });

        res.status(200).json({
            success: true,
            count: nearbyIssues.length,
            data: nearbyIssues.slice(0, 50) // Limit return size
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
        let issue = await Issue.findByPk(req.params.id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        // Check ownership
        if (issue.reporterId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this issue'
            });
        }

        // Only allow updating certain fields
        const { title, description, priority } = req.body;

        if (title) issue.title = title;
        if (description) issue.description = description;
        if (priority) issue.priority = priority;

        await issue.save();

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
        const issue = await Issue.findByPk(req.params.id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        // Check ownership
        if (issue.reporterId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this issue'
            });
        }

        // Delete associated images
        if (issue.images && Array.isArray(issue.images)) {
            for (const image of issue.images) {
                try {
                    await fs.unlink(image.path);
                } catch (err) {
                    // Ignore missing files
                }
            }
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
