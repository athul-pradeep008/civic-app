const { User } = require('../models'); // Import from index to get associations
const { Op } = require('sequelize');
const config = require('../config/config');

/**
 * @desc    Get signed JWT token (Helper wrapper if needed, though model has it)
 */
const getSignedJwtToken = (user) => {
    return user.getSignedJwtToken();
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const lowerEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email: lowerEmail }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email: lowerEmail,
            password
        });

        // Generate token
        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                reputationScore: user.reputationScore,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (Normalize email)
        const user = await User.findOne({
            where: {
                email: email.toLowerCase()
            }
        });

        if (!user) {
            console.warn(`[AUTH] Login Failed: User not found for email ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.warn(`[AUTH] Login Failed: Password mismatch for user ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                reputationScore: user.reputationScore,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: ['issuesReported'] // Using alias from associations
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};

/**
 * @desc    Logout user / clear token
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// --- ADVANCED AUTHENTICATION ---

/**
 * @desc    Google Login/Signup
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        // Verify token with Google (Dependency-free approach)
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const googleData = await googleRes.json();

        if (googleData.error || !googleData.email) {
            return res.status(401).json({ success: false, message: 'Invalid Google Token' });
        }

        // Security: Verify Audience Matches Client ID
        if (config.googleClientId && googleData.aud !== config.googleClientId) {
            return res.status(401).json({ success: false, message: 'Invalid Token Audience' });
        }

        const { email, sub: googleId, name, picture } = googleData;

        // Find or Create User
        let user = await User.findOne({
            where: {
                [Op.or]: [{ googleId }, { email }]
            }
        });

        if (!user) {
            // Create new user (Generate random password for schema validation)
            user = await User.create({
                username: name || email.split('@')[0],
                email,
                googleId,
                profileImage: picture,
                password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
            });
        } else {
            // Update existing user
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.profileImage) user.profileImage = picture;
                await user.save();
            }
        }

        const jwtToken = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token: jwtToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
};

/**
 * @desc    Send OTP (Email or Phone)
 * @route   POST /api/auth/otp/send
 * @access  Public
 */
exports.sendOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({ success: false, message: 'Please provide email or phone number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let query = {};
        if (email) query.email = email;
        else query.phoneNumber = phone;

        let user = await User.findOne({ where: query });

        if (!user) {
            if (phone) {
                user = await User.create({
                    phoneNumber: phone,
                    username: `user_${phone.slice(-4)}`,
                    email: `temp_${phone}@civic.local`,
                    password: Math.random().toString(36).slice(-8)
                });
            } else {
                return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
            }
        }

        // Save OTP hash
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP
        if (email) {
            const result = await require('../services/notificationService').sendEmail(
                email,
                'Your CivicReport Login Code',
                `Your login code is: ${otp}`
            );
            if (!result) { // Fallback if email service fails/not configured
                console.log(`[DEV MODE] Email OTP for ${email}: ${otp}`);
            }
        } else {
            // MOCK Phone SMS
            console.log(`\n📲 [SMS SIMULATION] To: ${phone} | Message: "Your CivicReport code is: ${otp}"\n`);
        }

        res.status(200).json({ success: true, message: `OTP sent to ${email || phone}` });

    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

/**
 * @desc    Verify OTP and Login
 * @route   POST /api/auth/otp/verify
 * @access  Public
 */
exports.verifyOtp = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;

        let query = {};
        if (email) query.email = email;
        else query.phoneNumber = phone;

        const user = await User.findOne({ where: query });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid Code' });
        }

        if (new Date(user.otpExpires) < new Date()) {
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        // clear OTP
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });

    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};
