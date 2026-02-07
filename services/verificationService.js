const { Issue } = require('../models');
const config = require('../config/config');
const { getDistance } = require('geolib');
const { Op } = require('sequelize');

/**
 * Check for duplicate issues within a specified radius
 */
exports.checkDuplicates = async (location, category, title) => {
    try {
        const { coordinates } = location;
        const [longitude, latitude] = coordinates;

        // SQLite doesn't support $near. We'll fetch issues with same category
        // and filter by distance in JS (which is fast enough for moderate datasets).
        // Optimization: We could add a bounding box query here if needed.

        const candidateIssues = await Issue.findAll({
            where: {
                category: category,
                status: {
                    [Op.notIn]: ['resolved', 'rejected']
                }
            }
        });

        const nearbyIssues = candidateIssues.filter(issue => {
            const dist = getDistance(
                { latitude: latitude, longitude: longitude },
                { latitude: issue.latitude, longitude: issue.longitude }
            );
            return dist <= config.verification.duplicateRadiusMeters;
        });

        // Check for similar titles (basic similarity check)
        const duplicates = nearbyIssues.filter(issue => {
            const similarity = calculateStringSimilarity(title.toLowerCase(), issue.title.toLowerCase());
            return similarity > 0.6; // 60% similarity threshold
        });

        return {
            isDuplicate: duplicates.length > 0,
            duplicateIssues: duplicates
        };
    } catch (error) {
        console.error('Duplicate check error:', error);
        return { isDuplicate: false, duplicateIssues: [] };
    }
};

/**
 * Calculate verification score based on votes and other factors
 */
exports.calculateVerificationScore = (issue) => {
    const netVotes = issue.upvotes - issue.downvotes;
    const totalVotes = issue.upvotes + issue.downvotes;

    let score = 0;

    // Vote-based score (0-50 points)
    if (totalVotes > 0) {
        score += Math.min(50, (netVotes / totalVotes) * 50);
    }

    // Image evidence (0-20 points)
    if (issue.images && issue.images.length > 0) {
        score += Math.min(20, issue.images.length * 10);
    }

    // Time factor - newer issues get slight boost (0-10 points)
    const daysSinceReport = (Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceReport < 7) {
        score += 10 - daysSinceReport;
    }

    // Reporter reputation (0-20 points)
    // This would be calculated based on reporter's history

    return Math.round(score);
};

/**
 * Determine if issue should be auto-verified
 */
exports.shouldAutoVerify = (issue) => {
    const score = exports.calculateVerificationScore(issue);
    const hasMinVotes = (issue.upvotes + issue.downvotes) >= config.verification.minVotesForVerification;
    const hasPositiveRatio = issue.upvotes > issue.downvotes * 2;

    return score >= 60 && hasMinVotes && hasPositiveRatio;
};

/**
 * Validate location coordinates
 */
exports.validateLocation = (coordinates) => {
    const [longitude, latitude] = coordinates;

    // Check if coordinates are valid
    if (longitude < -180 || longitude > 180) {
        return { valid: false, message: 'Invalid longitude' };
    }

    if (latitude < -90 || latitude > 90) {
        return { valid: false, message: 'Invalid latitude' };
    }

    return { valid: true };
};

/**
 * Detect spam patterns
 */
exports.detectSpam = async (userId) => {
    try {
        // Check how many issues user has reported in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentIssues = await Issue.count({
            where: {
                reporterId: userId,
                createdAt: {
                    [Op.gte]: oneHourAgo
                }
            }
        });

        return recentIssues >= config.verification.spamThreshold;
    } catch (error) {
        console.error('Spam detection error:', error);
        return false;
    }
};

/**
 * Validate image file
 */
exports.validateImage = (file) => {
    if (!file) {
        return { valid: false, message: 'No file provided' };
    }

    // Check file size
    if (file.size > config.maxFileSize) {
        return { valid: false, message: 'File size exceeds limit' };
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.mimetype)) {
        return { valid: false, message: 'Invalid file type' };
    }

    return { valid: true };
};

/**
 * Calculate string similarity (Dice coefficient)
 */
function calculateStringSimilarity(str1, str2) {
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);

    const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));

    return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
}

function getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
        bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
}
