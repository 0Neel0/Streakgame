const Notification = require('../models/notification.model');

/**
 * Create and save a notification
 * @param {string} userId - User ID to notify
 * @param {string} type - Type of notification
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @returns {Promise<Notification>}
 */
exports.createNotification = async (userId, type, message, data = {}) => {
    const notification = new Notification({
        userId,
        type,
        message,
        data
    });
    await notification.save();
    return notification;
};

/**
 * Emit Socket.io notification to a user
 * @param {object} io - Socket.io instance
 * @param {string} userId - User ID to emit to
 * @param {object} notification - Notification object
 */
exports.emitNotification = (io, userId, notification) => {
    if (io) {
        io.to(userId.toString()).emit('notification', notification);
    }
};

/**
 * Notify all members of a clan
 * @param {object} io - Socket.io instance
 * @param {Array} memberIds - Array of user IDs
 * @param {string} adminName - Name of admin who triggered the action
 * @param {string} seasonName - Name of the season
 * @param {number} newStreak - New streak value
 * @param {string} excludeUserId - User ID to exclude (usually the admin)
 */
exports.notifyClanMembers = async (io, memberIds, adminName, seasonName, newStreak, excludeUserId = null) => {
    const message = `${adminName} checked into ${seasonName}! Your season streak is now ${newStreak}.`;

    for (const memberId of memberIds) {
        // Skip the excluded user (usually the admin)
        if (excludeUserId && memberId.toString() === excludeUserId.toString()) {
            continue;
        }

        const notification = await exports.createNotification(
            memberId,
            'clan_checkin',
            message,
            {
                adminName,
                seasonName,
                newStreak,
                timestamp: new Date()
            }
        );

        // Emit real-time notification
        exports.emitNotification(io, memberId, notification);
    }
};
