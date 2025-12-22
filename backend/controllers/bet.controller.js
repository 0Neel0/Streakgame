const Bet = require('../models/bet.model');
const User = require('../models/user.model');
const notificationService = require('../services/notification.service');

/**
 * Create a new bet
 */
exports.createBet = async (req, res) => {
    try {
        const { amount, endDate } = req.body;
        const userId = req.user._id;

        // Validation
        if (!amount || amount < 10) {
            return res.status(400).send('Minimum bet is 10 XP');
        }

        if (!endDate) {
            return res.status(400).send('End date is required');
        }

        // Validate end date
        const betEndDate = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (betEndDate <= today) {
            return res.status(400).send('End date must be in the future');
        }

        // Max 30 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (betEndDate > maxDate) {
            return res.status(400).send('Maximum bet duration is 30 days');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if user has sufficient XP
        if (user.xp < amount) {
            return res.status(400).send('Insufficient XP balance');
        }

        // Check max bet (50% of user's XP)
        const maxBet = Math.floor(user.xp * 0.5);
        if (amount > maxBet) {
            return res.status(400).send(`Maximum bet is ${maxBet} XP (50% of your balance)`);
        }

        // Check for existing active bet (solo only, not friend challenges)
        const existingBet = await Bet.findOne({ userId, status: 'active', betType: { $ne: 'friend_challenge' } });
        if (existingBet) {
            return res.status(400).send('You already have an active bet');
        }

        // Deduct XP from user
        user.xp -= amount;
        await user.save();

        // Create bet
        const bet = new Bet({
            userId,
            amount,
            betEndDate: betEndDate,
            streakAtBet: user.overallStreak || 0
        });
        await bet.save();

        const daysUntilEnd = Math.ceil((betEndDate - today) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            bet,
            newBalance: user.xp,
            message: `Bet placed for ${daysUntilEnd} days! Maintain your streak until ${betEndDate.toLocaleDateString()} to win ${amount * 2} XP`
        });

    } catch (err) {
        console.error('[Bet] Create error:', err);
        res.status(500).send(err.message || 'Failed to create bet');
    }
};

/**
 * Get user's active bet
 */
exports.getActiveBet = async (req, res) => {
    try {
        const userId = req.user._id;
        const bet = await Bet.findOne({ userId, status: 'active' });
        res.json(bet);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

/**
 * Get bet history
 */
exports.getBetHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const bets = await Bet.find({ userId, status: { $in: ['won', 'lost'] } })
            .sort({ resolvedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Bet.countDocuments({ userId, status: { $in: ['won', 'lost'] } });

        // Calculate stats
        const wonBets = await Bet.countDocuments({ userId, status: 'won' });
        const lostBets = await Bet.countDocuments({ userId, status: 'lost' });
        const totalWon = await Bet.aggregate([
            { $match: { userId: userId, status: 'won' } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$amount', '$multiplier'] } } } }
        ]);
        const totalLost = await Bet.aggregate([
            { $match: { userId: userId, status: 'lost' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            bets,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: {
                totalBets: wonBets + lostBets,
                won: wonBets,
                lost: lostBets,
                winRate: wonBets + lostBets > 0 ? (wonBets / (wonBets + lostBets) * 100).toFixed(1) : 0,
                totalWon: totalWon[0]?.total || 0,
                totalLost: totalLost[0]?.total || 0,
                netProfit: (totalWon[0]?.total || 0) - (totalLost[0]?.total || 0)
            }
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

/**
 * Resolve a bet (internal function, called from check-in or streak break)
 */
exports.resolveBet = async (betId, outcome, io = null) => {
    try {
        const bet = await Bet.findById(betId).populate('userId');
        if (!bet || bet.status !== 'active') {
            return { success: false, message: 'Bet not found or already resolved' };
        }

        bet.status = outcome; // 'won' or 'lost'
        bet.resolvedAt = new Date();
        await bet.save();

        const user = await User.findById(bet.userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (outcome === 'won') {
            // Award 2× bet amount
            const winnings = bet.amount * bet.multiplier;
            user.xp += winnings;
            await user.save();

            // Send notification
            const notif = await notificationService.createNotification(
                user._id,
                'bet_won',
                `🎉 Bet won! You earned ${winnings} XP (bet: ${bet.amount} XP)`,
                { betId: bet._id, winnings, betAmount: bet.amount }
            );
            if (io) notificationService.emitNotification(io, user._id, notif);

            return { success: true, outcome: 'won', winnings, newBalance: user.xp };

        } else if (outcome === 'lost') {
            // XP already deducted when bet was created, just notify
            const notif = await notificationService.createNotification(
                user._id,
                'bet_lost',
                `❌ Bet lost! You lost ${bet.amount} XP due to streak break.`,
                { betId: bet._id, lostAmount: bet.amount }
            );
            if (io) notificationService.emitNotification(io, user._id, notif);

            return { success: true, outcome: 'lost', lostAmount: bet.amount, newBalance: user.xp };
        }

    } catch (err) {
        console.error('[Bet] Resolve error:', err);
        return { success: false, message: err.message };
    }
};
