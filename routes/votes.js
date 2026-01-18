const express = require('express');
const router = express.Router();
const { voteIssue, getUserVote } = require('../controllers/voteController');
const { protect } = require('../middleware/auth');

// Routes
router.post('/:issueId', protect, voteIssue);
router.get('/:issueId', protect, getUserVote);

module.exports = router;
