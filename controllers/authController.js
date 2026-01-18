const User = require('../models/User');
const { getSignedJwtToken } = require('../middleware/auth');
const config = require('../config/config');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password
        });

        // Generate token
        const token = getSignedJwtToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
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

        // Check for user (include password field)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = getSignedJwtToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
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
        const user = await User.findById(req.user.id).populate('issuesReported');

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
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

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

        const jwtToken = getSignedJwtToken(user._id);

        res.status(200).json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
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

        // Find user to attach OTP (Upsert if using Phone, but normally we check registration)
        // For simplicity: We require an existing user or create a temporary record? 
        // Strategy: Just check if user exists. If not, we might need a registration flow.
        // For this implementation, we'll allow OTP for existing users OR new phone users (auto-create).

        let query = email ? { email } : { phoneNumber: phone };
        let user = await User.findOne(query);

        if (!user) {
            // If user doesn't exist, we can either block or create a "stub" user.
            // For smooth UX, we'll permit it for Phone, but Email usually requires full registration.
            // Let's create a stub user for Phone, but block for Email if not found (or treat as registration).
            if (phone) {
                user = await User.create({
                    phoneNumber: phone,
                    username: `user_${phone.slice(-4)}`,
                    email: `temp_${phone}@civic.local`, // Dummy email to satisfy schema if required
                    password: Math.random().toString(36).slice(-8)
                });
            } else {
                return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
            }
        }

        // Save OTP hash (plain for MVP simplicity, use bcrypt in prod)
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save({ validateBeforeSave: false });

        // Send OTP
        if (email) {
            // Use Nodemailer
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport(config.email); // Assuming config has email settings

            // Note: If config.email is missing credentials, this will fail. 
            // Fallback: Log to console if no creds
            if (!config.email.user) {
                console.log(`[DEV MODE] Email OTP for ${email}: ${otp}`);
            } else {
                await transporter.sendMail({
                    from: config.email.from,
                    to: email,
                    subject: 'Your CivicReport Login Code',
                    text: `Your login code is: ${otp}`
                });
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

        let query = email ? { email } : { phoneNumber: phone };
        const user = await User.findOne(query).select('+otp +otpExpires');

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid Code' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        // clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        const token = getSignedJwtToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
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
