const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, logout, googleLogin, sendOtp, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Advanced Auth Routes
router.post('/google', authLimiter, googleLogin);
router.post('/otp/send', authLimiter, sendOtp);
router.post('/otp/verify', authLimiter, verifyOtp);

// Public Config (Safe frontend settings)
router.get('/config', (req, res) => {
    const config = require('../config/config');
    res.json({
        success: true,
        googleClientId: config.googleClientId
    });
});

module.exports = router;
