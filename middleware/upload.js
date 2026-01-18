const multer = require('multer');
const path = require('path');
const config = require('../config/config');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (config.allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.maxFileSize
    },
    fileFilter: fileFilter
});

module.exports = upload;
