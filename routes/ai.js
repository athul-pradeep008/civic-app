const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');

// Configure multer for memory storage (so we can pass buffer to AI directly)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Chat route
router.post('/chat', aiController.chat);

// Image analysis route
router.post('/analyze-image', upload.single('image'), aiController.analyzeImage);

// Suggest priority route
router.post('/suggest-priority', aiController.suggestPriority);

// Suggest resolution route
router.post('/suggest-resolution', aiController.suggestResolution);

module.exports = router;
