const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    createIssue,
    getIssues,
    getIssue,
    getNearbyIssues,
    updateIssue,
    deleteIssue
} = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { issueCreationLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Validation rules
const createIssueValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['pothole', 'streetlight', 'garbage', 'drainage', 'water_supply', 'road_damage', 'traffic_signal', 'park_maintenance', 'graffiti', 'other'])
        .withMessage('Invalid category'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required')
];

// Routes
router.post(
    '/',
    protect,
    issueCreationLimiter,
    upload.array('images', 5),
    createIssueValidation,
    validate,
    createIssue
);

router.get('/', getIssues);
router.get('/nearby/:longitude/:latitude', getNearbyIssues);
router.get('/:id', getIssue);
router.put('/:id', protect, updateIssue);
router.delete('/:id', protect, deleteIssue);

module.exports = router;
