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

    // --- Update Global Login Date if needed ---
    // Checking into a season counts as being active today.
    if (user.lastLoginDate) {
        const userLastLogin = new Date(user.lastLoginDate);
        userLastLogin.setHours(0, 0, 0, 0);
        const checkInNormalized = new Date(now);
        checkInNormalized.setHours(0, 0, 0, 0);

        // If user hasn't logged in "today" but is checking in, update their global lastLoginDate
        if (userLastLogin.getTime() < checkInNormalized.getTime()) {
            user.lastLoginDate = now;
        }
    } else {
        // First ever login/activity
        user.lastLoginDate = now;
    }

    let seasonStreak = user.seasonStreaks.find(s => s.seasonId.toString() === seasonId);
    let message = '';

    let xpGained = 0;

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
            return { message: 'Already checked in today', streak: seasonStreak.streak, xpGained: 0, totalXp: user.xp || 0 };
        } else if (diffDays === 1) {
            // Consecutive day
            seasonStreak.streak += 1;
            seasonStreak.lastLoginDate = now;
            message = 'Checked in successfully';

            // XP Reward
            if (seasonStreak.streak === 5) {
                user.unclaimedRewards.push({ xp: 50, reason: `5 Day Season Streak` });
            }
            else if (seasonStreak.streak === 10) {
                user.unclaimedRewards.push({ xp: 100, reason: `10 Day Season Streak` });
            }


        } else {
            // Break in streak
            seasonStreak.streak = 1;
            seasonStreak.lastLoginDate = now;
            message = 'Streak broken but checked in';

            // Check for active friend challenges and resolve them as lost
            const Bet = require('../models/bet.model');
            const challengeController = require('../controllers/challenge.controller');
            const betController = require('../controllers/bet.controller');

            const activeChallenges = await Bet.find({
                betType: 'friend_challenge',
                challengeStatus: 'active',
                $or: [
                    { challengerId: userId },
                    { opponentId: userId }
                ]
            });

            // Resolve all active challenges where this user is a participant
            for (const challenge of activeChallenges) {
                await challengeController.resolveFriendChallenge(challenge._id, userId);
            }

            // Also resolve any active solo bets as lost
            const activeSoloBets = await Bet.find({
                userId,
                status: 'active',
                betType: { $ne: 'friend_challenge' } // Solo bets only
            });

            for (const bet of activeSoloBets) {
                await betController.resolveBet(bet._id, 'lost', null);
                console.log(`[Streak] Resolved solo bet ${bet._id} as lost due to streak break`);
            }
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

    if (xpGained > 0) {
        user.xp = (user.xp || 0) + xpGained;
    }

    // --- XP REWARD LOGIC (SEASON) ---
    // Every 3 days of season streak -> +30 XP
    if (seasonStreak.streak > 0 && seasonStreak.streak % 3 === 0) {
        user.unclaimedRewards.push({ xp: 30, reason: `3 Day Season Streak` });
    }

    await user.save();

    return {
        message: `Checked in! Season Streak: ${seasonStreak.streak}`,
        streak: seasonStreak.streak,
        xpGained,
        totalXp: user.xp
    };
};
