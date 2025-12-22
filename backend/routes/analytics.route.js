const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// User analytics
router.get('/user', analyticsController.getUserAnalytics);

// Admin analytics
router.get('/admin', analyticsController.getAdminAnalytics);

module.exports = router;
