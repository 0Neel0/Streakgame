const User = require('../models/user.model');

/**
 * Calculate comprehensive analytics for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Analytics data
 */
exports.calculateUserMetrics = async (userId) => {
    try {
        const user = await User.findById(userId).populate('seasonStreaks.seasonId');

        if (!user) {
            throw new Error('User not found');
        }

        // Basic metrics
        const currentStreak = user.overallStreak || 0;
        const totalXP = user.xp || 0;

        // Calculate longest streak from season streaks
        const longestStreak = user.seasonStreaks && user.seasonStreaks.length > 0
            ? Math.max(...user.seasonStreaks.map(s => s.streak || 0), currentStreak)
            : currentStreak;

        // Average streak length
        const streakLengths = user.seasonStreaks?.map(s => s.streak || 0) || [];
        const avgStreakLength = streakLengths.length > 0
            ? (streakLengths.reduce((a, b) => a + b, 0) / streakLengths.length).toFixed(1)
            : 0;

        // Calculate streak break rate (simplified: breaks = seasons with 0 streak)
        const totalSeasons = user.seasonStreaks?.length || 0;
        const brokenStreaks = user.seasonStreaks?.filter(s => s.streak === 0).length || 0;
        const streakBreakRate = totalSeasons > 0 ? (brokenStreaks / totalSeasons).toFixed(2) : 0;

        // Best time of day (analyze lastLoginDate hour)
        const loginHour = user.lastLoginDate ? new Date(user.lastLoginDate).getHours() : null;
        const bestTimeOfDay = loginHour !== null ? `${loginHour}:00` : 'No data';

        // Login time distribution (simplified - we'd need historical data for accurate analysis)
        const loginTimeDistribution = {
            '0-6': 0,
            '6-12': 0,
            '12-18': 0,
            '18-24': loginHour !== null && loginHour >= 18 ? 1 : 0
        };

        // Streak history (last 30 days - simplified)
        const streakHistory = user.seasonStreaks?.slice(-30).map(s => ({
            date: s.lastLoginDate || s.updatedAt,
            streak: s.streak || 0,
            seasonName: s.seasonId?.name || 'Unknown'
        })) || [];

        // Habit success rate (seasons with active streaks / total seasons)
        const activeStreaks = user.seasonStreaks?.filter(s => s.streak > 0).length || 0;
        const habitSuccessRate = totalSeasons > 0 ? (activeStreaks / totalSeasons).toFixed(2) : 0;

        return {
            currentStreak,
            longestStreak,
            avgStreakLength: parseFloat(avgStreakLength),
            streakBreakRate: parseFloat(streakBreakRate),
            totalXP,
            bestTimeOfDay,
            habitSuccessRate: parseFloat(habitSuccessRate),
            streakHistory,
            loginTimeDistribution,
            totalSeasons,
            activeStreaks
        };

    } catch (error) {
        console.error('[Analytics] Error calculating user metrics:', error);
        throw error;
    }
};

/**
 * Calculate admin-level platform metrics
 * @returns {Promise<object>} Admin analytics
 */
exports.calculateAdminMetrics = async () => {
    try {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

        // DAU: Users who logged in today
        const dau = await User.countDocuments({
            lastLoginDate: { $gte: today }
        });

        // MAU: Users who logged in in last 30 days
        const mau = await User.countDocuments({
            lastLoginDate: { $gte: thirtyDaysAgo }
        });

        // Total users
        const totalUsers = await User.countDocuments();

        // Average streak across all users
        const users = await User.find({}).select('overallStreak');
        const avgStreak = users.length > 0
            ? (users.reduce((sum, u) => sum + (u.overallStreak || 0), 0) / users.length).toFixed(1)
            : 0;

        // Get longest streak on platform
        const userWithLongestStreak = await User.findOne().sort({ overallStreak: -1 }).select('username overallStreak');

        return {
            dau,
            mau,
            totalUsers,
            avgStreak: parseFloat(avgStreak),
            longestPlatformStreak: userWithLongestStreak?.overallStreak || 0,
            topStreaker: userWithLongestStreak?.username || 'N/A'
        };

    } catch (error) {
        console.error('[Analytics] Error calculating admin metrics:', error);
        throw error;
    }
};
