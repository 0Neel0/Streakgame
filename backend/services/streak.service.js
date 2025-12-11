const User = require('../models/user.model');
const Season = require('../models/season.model');

/**
 * Checks in a user to a season and updates their streak.
 * @param {string} userId - The ID of the user.
 * @param {string} seasonId - The ID of the season.
 * @returns {Promise<{message: string, streak: number}>}
 */
exports.checkInUserToSeason = async (userId, seasonId, checkInDate) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const season = await Season.findById(seasonId);
    if (!season) throw new Error('Season not found');

    // Check if date is within season
    const today = checkInDate ? new Date(checkInDate) : new Date();
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);

    // Normalize for comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Actual current time for range check (or custom date)
    const now = checkInDate ? new Date(checkInDate) : new Date();

    console.log(`Check-in attempt. User: ${userId}, Season: ${seasonId}, Date: ${now}, LastLogin: ${user.lastLoginDate}`);

    if (now < start || now > end) {
        throw new Error('Season is not currently active');
    }

    // --- Strict Check: Must match global login date ---
    if (user.lastLoginDate) {
        const userLastLogin = new Date(user.lastLoginDate);
        userLastLogin.setHours(0, 0, 0, 0);

        const checkInNormalized = new Date(now);
        checkInNormalized.setHours(0, 0, 0, 0);

        if (userLastLogin.getTime() !== checkInNormalized.getTime()) {
            throw new Error('Check-in date must match your last login date');
        }
    } else {
        throw new Error('User has no login record');
    }

    let seasonStreak = user.seasonStreaks.find(s => s.seasonId.toString() === seasonId);
    let message = '';

    if (seasonStreak) {
        // Check last login date
        const lastLogin = new Date(seasonStreak.lastLoginDate);

        // Calculate Day Difference
        // We strip time components to compare calendar days
        // 'today' is already normalized checkInDate from lines 18 & 23
        const todayDay = today.getTime();
        const lastLoginDay = new Date(lastLogin).setHours(0, 0, 0, 0);

        const diffTime = Math.abs(todayDay - lastLoginDay);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return { message: 'Already checked in today', streak: seasonStreak.streak };
        } else if (diffDays === 1) {
            // Consecutive day
            seasonStreak.streak += 1;
            seasonStreak.lastLoginDate = now;
            message = 'Checked in successfully';
        } else {
            // Break in streak
            seasonStreak.streak = 1;
            seasonStreak.lastLoginDate = now;
            message = 'Streak broken but checked in';
        }
    } else {
        // First time check-in for this season
        user.seasonStreaks.push({
            seasonId: seasonId,
            streak: 1, // Start at 1
            lastLoginDate: now
        });
        seasonStreak = user.seasonStreaks[user.seasonStreaks.length - 1];
        message = 'Checked in successfully';
    }

    await user.save();
    return { message, streak: seasonStreak.streak };
};
