const analyticsService = require('../services/analytics.service');

/**
 * Get user analytics
 */
exports.getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const metrics = await analyticsService.calculateUserMetrics(userId);
        res.json(metrics);
    } catch (error) {
        console.error('[Analytics Controller] Error:', error);
        res.status(500).send(error.message || 'Failed to fetch analytics');
    }
};

/**
 * Get admin analytics (admin only)
 */
exports.getAdminAnalytics = async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).send('Admin access required');
        }

        const metrics = await analyticsService.calculateAdminMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('[Analytics Controller] Error:', error);
        res.status(500).send(error.message || 'Failed to fetch admin analytics');
    }
};
