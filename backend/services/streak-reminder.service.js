const User = require('../models/user.model');
const notificationService = require('./notification.service');

/**
 * Send streak reminder notifications to users who haven't checked in today
 * @param {object} io - Socket.io instance
 */
exports.sendStreakReminders = async (io) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day

        // Find users who haven't logged in today
        const usersNeedingReminder = await User.find({
            $or: [
                { lastLoginDate: { $lt: today } },
                { lastLoginDate: null }
            ]
        }).select('_id username lastLoginDate overallStreak');

        console.log(`[Streak Reminder] Found ${usersNeedingReminder.length} users needing reminders`);

        let notificationsSent = 0;

        for (const user of usersNeedingReminder) {
            // Skip users with no streak (nothing to lose)
            if (!user.overallStreak || user.overallStreak === 0) {
                continue;
            }

            const notification = await notificationService.createNotification(
                user._id,
                'streak_reminder',
                `🔥 Don't break your ${user.overallStreak}-day streak! Check in now to keep it alive.`,
                {
                    currentStreak: user.overallStreak,
                    timestamp: new Date()
                }
            );

            // Emit real-time notification if user is connected
            if (io) {
                notificationService.emitNotification(io, user._id, notification);
            }

            notificationsSent++;
        }

        console.log(`[Streak Reminder] Sent ${notificationsSent} reminder notifications`);
        return { success: true, count: notificationsSent };

    } catch (error) {
        console.error('[Streak Reminder] Error:', error);
        return { success: false, error: error.message };
    }
};
