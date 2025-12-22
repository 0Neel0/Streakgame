const Bet = require('../models/bet.model');
const User = require('../models/user.model');
const notificationService = require('../services/notification.service');

/**
 * Send a challenge to a friend
 */
exports.sendChallenge = async (req, res) => {
    try {
        const { friendId, amount, endDate } = req.body;
        const challengerId = req.user._id;

        console.log('[Challenge] Request:', { friendId, amount, endDate, challengerId });

        // Validation
        if (!friendId || !amount) {
            return res.status(400).send('Friend ID and amount are required');
        }

        if (!endDate) {
            return res.status(400).send('End date is required');
        }

        if (amount < 10) {
            return res.status(400).send('Minimum bet is 10 XP');
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
            return res.status(400).send('Maximum challenge duration is 30 days');
        }

        const challenger = await User.findById(challengerId);
        const opponent = await User.findById(friendId);

        console.log('[Challenge] Users found:', {
            challenger: !!challenger,
            opponent: !!opponent,
            challengerFriends: challenger?.friends?.length || 0
        });

        if (!challenger) {
            return res.status(404).send('Challenger not found');
        }

        if (!opponent) {
            return res.status(404).send('Friend not found');
        }

        // Check if they are friends - convert both to strings for comparison
        const friendIdStr = friendId.toString();
        const areFriends = challenger.friends?.some(f => f.toString() === friendIdStr);

        console.log('[Challenge] Friends check:', { areFriends, friendIdStr });

        if (!areFriends) {
            return res.status(400).send('You can only challenge friends');
        }

        // Check if challenger has sufficient XP
        if (challenger.xp < amount) {
            return res.status(400).send('Insufficient XP balance');
        }

        // Check max bet (50% of user's XP)
        const maxBet = Math.floor(challenger.xp * 0.5);
        if (amount > maxBet) {
            return res.status(400).send(`Maximum bet is ${maxBet} XP (50% of your balance)`);
        }

        // Create challenge (don't deduct XP yet, only when accepted)
        const challenge = new Bet({
            betType: 'friend_challenge',
            userId: challengerId,
            challengerId: challengerId,
            opponentId: friendId,
            amount,
            betEndDate: betEndDate,
            challengeStatus: 'pending',
            streakAtBet: challenger.overallStreak || 0
        });
        await challenge.save();

        // Send notification to opponent (with error handling)
        try {
            const notif = await notificationService.createNotification(
                friendId,
                'challenge_received',
                `${challenger.username} challenged you to a ${amount} XP streak battle!`,
                { challengeId: challenge._id, amount, challengerName: challenger.username }
            );

            const io = req.app.get('io');
            if (io) notificationService.emitNotification(io, friendId, notif);
        } catch (notifError) {
            console.error('[Challenge] Notification error (non-fatal):', notifError.message);
        }

        res.json({
            success: true,
            challenge,
            message: `Challenge sent to ${opponent.username}!`
        });

    } catch (err) {
        console.error('[Challenge] Send error:', err);
        console.error('[Challenge] Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        res.status(500).send(err.message || 'Failed to send challenge');
    }
};

/**
 * Accept a challenge
 */
exports.acceptChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const opponentId = req.user._id;

        const challenge = await Bet.findById(challengeId).populate('challengerId');
        if (!challenge || challenge.betType !== 'friend_challenge') {
            return res.status(404).send('Challenge not found');
        }

        if (challenge.opponentId.toString() !== opponentId.toString()) {
            return res.status(403).send('Not your challenge');
        }

        if (challenge.challengeStatus !== 'pending') {
            return res.status(400).send('Challenge already processed');
        }

        const opponent = await User.findById(opponentId);
        const challenger = await User.findById(challenge.challengerId);

        // Check if opponent has sufficient XP
        if (opponent.xp < challenge.amount) {
            return res.status(400).send('Insufficient XP to accept challenge');
        }

        // Check if challenger still has sufficient XP
        if (challenger.xp < challenge.amount) {
            return res.status(400).send('Challenger no longer has sufficient XP');
        }

        // Deduct XP from both users
        opponent.xp -= challenge.amount;
        challenger.xp -= challenge.amount;
        await opponent.save();
        await challenger.save();

        // Update challenge status
        challenge.challengeStatus = 'active';
        challenge.status = 'active';
        challenge.acceptedAt = new Date();
        await challenge.save();

        // Notify challenger (with error handling)
        try {
            const notif = await notificationService.createNotification(
                challenge.challengerId,
                'challenge_accepted',
                `${opponent.username} accepted your ${challenge.amount} XP challenge! Game on!`,
                { challengeId: challenge._id, amount: challenge.amount }
            );

            const io = req.app.get('io');
            if (io) notificationService.emitNotification(io, challenge.challengerId, notif);
        } catch (notifError) {
            console.error('[Challenge] Notification error (non-fatal):', notifError.message);
        }

        res.json({
            success: true,
            challenge,
            newBalance: opponent.xp,
            message: 'Challenge accepted!'
        });

    } catch (err) {
        console.error('[Challenge] Accept error:', err);
        res.status(500).send(err.message || 'Failed to accept challenge');
    }
};

/**
 * Decline a challenge
 */
exports.declineChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const opponentId = req.user._id;

        const challenge = await Bet.findById(challengeId).populate('challengerId');
        if (!challenge) {
            return res.status(404).send('Challenge not found');
        }

        if (challenge.opponentId.toString() !== opponentId.toString()) {
            return res.status(403).send('Not your challenge');
        }

        if (challenge.challengeStatus !== 'pending') {
            return res.status(400).send('Challenge already processed');
        }

        challenge.challengeStatus = 'declined';
        challenge.status = 'lost'; // Mark as inactive
        await challenge.save();

        const opponent = await User.findById(opponentId);

        // Notify challenger (with error handling)
        try {
            const notif = await notificationService.createNotification(
                challenge.challengerId,
                'challenge_declined',
                `${opponent.username} declined your challenge.`,
                { challengeId: challenge._id }
            );

            const io = req.app.get('io');
            if (io) notificationService.emitNotification(io, challenge.challengerId, notif);
        } catch (notifError) {
            console.error('[Challenge] Notification error (non-fatal):', notifError.message);
        }

        res.json({
            success: true,
            message: 'Challenge declined'
        });

    } catch (err) {
        console.error('[Challenge] Decline error:', err);
        res.status(500).send(err.message);
    }
};

/**
 * Get pending challenges (incoming and outgoing)
 */
exports.getPendingChallenges = async (req, res) => {
    try {
        const userId = req.user._id;

        const incoming = await Bet.find({
            opponentId: userId,
            betType: 'friend_challenge',
            challengeStatus: 'pending'
        }).populate('challengerId', 'username profilePicture xp overallStreak');

        const outgoing = await Bet.find({
            challengerId: userId,
            betType: 'friend_challenge',
            challengeStatus: 'pending'
        }).populate('opponentId', 'username profilePicture xp overallStreak');

        res.json({ incoming, outgoing });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

/**
 * Get active friend challenges
 */
exports.getActiveChallenges = async (req, res) => {
    try {
        const userId = req.user._id;

        const challenges = await Bet.find({
            betType: 'friend_challenge',
            challengeStatus: 'active',
            $or: [
                { challengerId: userId },
                { opponentId: userId }
            ]
        })
            .populate('challengerId', 'username profilePicture xp overallStreak')
            .populate('opponentId', 'username profilePicture xp overallStreak');

        res.json(challenges);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

/**
 * Resolve a friend challenge (called when someone breaks streak)
 */
exports.resolveFriendChallenge = async (challengeId, loserId, io = null) => {
    try {
        const challenge = await Bet.findById(challengeId)
            .populate('challengerId')
            .populate('opponentId');

        if (!challenge || challenge.challengeStatus !== 'active') {
            return { success: false, message: 'Challenge not active' };
        }

        // Determine winner
        const winnerId = challenge.challengerId._id.toString() === loserId.toString()
            ? challenge.opponentId._id
            : challenge.challengerId._id;

        const winner = await User.findById(winnerId);
        const loser = await User.findById(loserId);

        // Award pot to winner (2× stake)
        const winnings = challenge.amount * 2;
        winner.xp += winnings;
        await winner.save();

        // Update challenge
        challenge.challengeStatus = 'completed';
        challenge.status = 'won';
        challenge.winnerId = winnerId;
        challenge.resolvedAt = new Date();
        await challenge.save();

        // Notifications
        const winNotif = await notificationService.createNotification(
            winnerId,
            'challenge_won',
            `🎉 You won the challenge against ${loser.username}! +${winnings} XP`,
            { challengeId: challenge._id, winnings, opponentName: loser.username }
        );

        const loseNotif = await notificationService.createNotification(
            loserId,
            'challenge_lost',
            `You lost the challenge to ${winner.username}. Streak broken!`,
            { challengeId: challenge._id, opponentName: winner.username }
        );

        if (io) {
            notificationService.emitNotification(io, winnerId, winNotif);
            notificationService.emitNotification(io, loserId, loseNotif);
        }

        return { success: true, winnerId, winnings };

    } catch (err) {
        console.error('[Challenge] Resolve error:', err);
        return { success: false, message: err.message };
    }
};
