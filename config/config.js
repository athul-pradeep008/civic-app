require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5002,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    // Database - SQLite (No URI needed)
    // mongoUri: Removed


    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',

    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // Auth - Google
    googleClientId: process.env.GOOGLE_CLIENT_ID,

    // File Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

    // Email
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM
    },

    // Admin
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@civicissues.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    },

    // Verification Settings
    verification: {
        duplicateRadiusMeters: parseInt(process.env.DUPLICATE_RADIUS_METERS) || 100,
        minVotesForVerification: parseInt(process.env.MIN_VOTES_FOR_VERIFICATION) || 3,
        spamThreshold: parseInt(process.env.SPAM_THRESHOLD) || 5
    }
};
