const Notification = require('../models/notification.model');

/**
 * Get all notifications for authenticated user
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50, skip = 0, unreadOnly = false } = req.query;

        const filter = { userId };
        if (unreadOnly === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        res.json({
            notifications,
            unreadCount
        });
    } catch (err) {
        console.error('Get Notifications Error:', err);
        res.status(500).send(err.message || 'Failed to get notifications');
    }
};

/**
 * Mark notification(s) as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;
        const { all = false } = req.body;

        if (all) {
            // Mark all as read
            await Notification.updateMany(
                { userId, read: false },
                { read: true }
            );
            res.json({ success: true, message: 'All notifications marked as read' });
        } else if (notificationId) {
            // Mark specific notification as read
            const notification = await Notification.findOne({ _id: notificationId, userId });
            if (!notification) {
                return res.status(404).send('Notification not found');
            }
            notification.read = true;
            await notification.save();
            res.json({ success: true, message: 'Notification marked as read' });
        } else {
            res.status(400).send('Notification ID or "all" flag required');
        }
    } catch (err) {
        console.error('Mark As Read Error:', err);
        res.status(500).send(err.message || 'Failed to mark as read');
    }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({ _id: notificationId, userId });
        if (!notification) {
            return res.status(404).send('Notification not found');
        }

        await Notification.findByIdAndDelete(notificationId);

        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('Delete Notification Error:', err);
        res.status(500).send(err.message || 'Failed to delete notification');
    }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ userId, read: false });
        res.json({ count });
    } catch (err) {
        console.error('Get Unread Count Error:', err);
        res.status(500).send(err.message || 'Failed to get unread count');
    }
};
