const express = require('express');
const router = express.Router();
const {
    updateIssueStatus,
    getStatistics,
    deleteIssue,
    getUsers
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Routes
router.get('/stats', getStatistics);
router.get('/users', getUsers);
router.put('/issues/:id/status', updateIssueStatus);
router.delete('/issues/:id', deleteIssue);

module.exports = router;
