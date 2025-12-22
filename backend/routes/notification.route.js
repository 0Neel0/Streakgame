const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(verifyToken);

// Get notifications for authenticated user
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark notification(s) as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all as read
router.put('/read/all', notificationController.markAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
