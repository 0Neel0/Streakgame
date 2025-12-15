const User = require('../models/user.model');
const Season = require('../models/season.model');
const Settings = require('../models/settings.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

// Helper to normalize date (strip time)
const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

exports.register = async (req, res) => {
    // Check if user exists (by email or username)
    const { email, username, password, role } = req.body || {};
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send({ message: 'Email already exists' });

    const usernameExist = await User.findOne({ username });
    if (usernameExist) return res.status(400).send({ message: 'Username already exists' });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
        username: username,
        email: email,
        password: hashedPassword,
        role: role || 'user'
    });

    try {
        const savedUser = await user.save();
        res.send({ user: savedUser._id });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send('Email or Username already exists');
        }
        res.status(400).send(err.message || 'Registration failed');
    }
};

exports.login = async (req, res) => {
    // Validate User
    // Validate User
    const { email, password } = req.body || {};

    console.log('--- LOGIN REQUEST DEBUG ---');
    console.log('req.body:', req.body);
    console.log('req.query:', req.query);

    // Allow date from body OR query, supporting both 'date' and 'lastLoginDate' keys
    let date = req.body.date || req.body.lastLoginDate || req.query.date || req.query.lastLoginDate;

    console.log('Raw date detected:', date);

    // Validate Date if provided
    if (date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.warn(`Invalid date provided to login: ${date}`);
            date = null; // Fallback to now if invalid
        } else {
            console.log('Parsed valid date:', d.toISOString());
        }
    } else {
        console.log('No date provided, defaulting to NOW.');
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email is not found');

    // Validate Password
    const validPass = await comparePassword(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // --- STREAK LOGIC ---
    let xpGained = 0;
    let overallStreak = user.overallStreak;
    const effectiveDate = date ? new Date(date) : new Date();

    // Only Process Streak if NOT Admin
    if (user.role !== 'admin') {
        const today = normalizeDate(effectiveDate);
        const lastLogin = user.lastLoginDate ? normalizeDate(user.lastLoginDate) : null;

        // 1. Overall Streak
        if (lastLogin) {
            const diffTime = Math.abs(today - lastLogin);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                overallStreak += 1;
            } else if (diffDays > 1) {
                // Missed a day (or more)
                overallStreak = 1; // Reset to 1 (starting today)
            }
            // If diffDays === 0, do nothing (already logged in today)
        } else {
            // First ever login
            overallStreak = 1;
        }

        // XP Reward Logic (Based on Overall Streak)
        // Only award if streak INCREASED (diffDays === 1) or it's first login (streak === 1, no reward usually but good to know)
        // Actually simplicity: if current streak hits milestone today

        // We only want to award ONCE per day.
        // The logic above increments overallStreak if diffDays === 1.
        // If diffDays === 0, it doesn't increment.
        // So we can check if (diffDays === 1) then check milestones.
        // Or simpler: Check if we haven't awarded for this streak yet? No, that's complex.
        // Just rely on the fact that overallStreak increments only once per day.

        // Recalculate diffDays for clarity if needed, or just track if we incremented.
        let incremented = false;
        if (lastLogin) {
            const diffTime = Math.abs(today - lastLogin);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) incremented = true;
        } else {
            incremented = true; // First login
        }

        if (incremented) {
            if (overallStreak > 0 && overallStreak % 10 === 0) {
                user.unclaimedRewards.push({
                    xp: 100,
                    reason: `10 Day Global Streak`
                });
            } else if (overallStreak > 0 && overallStreak % 5 === 0) {
                user.unclaimedRewards.push({
                    xp: 50,
                    reason: `5 Day Global Streak`
                });
            }
        }

        user.overallStreak = overallStreak;
    }

    // Always update lastLoginDate for reference, even for admins (optional, but good for tracking activity)
    user.lastLoginDate = effectiveDate;

    // 2. Season Streak - REMOVED
    // Streak logic is now handled exclusively via explicit check-in per season.

    await user.save();

    // We need the latest state
    const updatedUser = await User.findById(user._id);

    const token = generateToken({ _id: updatedUser._id, role: updatedUser.role });
    res.header('auth-token', token).send({ token, user: { ...updatedUser._doc, password: '' }, xpGained });
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, description, profilePicture } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        // Check username uniqueness if changing
        if (username && username !== user.username) {
            const exists = await User.findOne({ username });
            if (exists) return res.status(400).send('Username already taken');
            user.username = username;
        }

        if (description !== undefined) user.description = description;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        const updatedUser = await user.save();

        // Return updated user data (sanitize password)
        res.json({ ...updatedUser._doc, password: '' });
    } catch (err) {
        res.status(400).send(err.message || 'Update failed');
    }
};

exports.claimRoyalPass = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).send('User not found');
        if (user.role === 'admin') return res.status(403).send('Admins cannot claim Royal Pass');

        // Check Renewal Eligibility (10 Days)
        if (user.lastRoyalPassClaimDate) {
            const lastClaim = new Date(user.lastRoyalPassClaimDate);
            const now = new Date();
            const diffTime = Math.abs(now - lastClaim);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 10) {
                return res.status(400).send(`Royal Pass is active. Renewable in ${10 - diffDays} days.`);
            }
        }

        // Fetch Settings
        const settings = await Settings.getSettings();
        const { minStreak, minSeasons, xpReward } = settings.royalPassConfig;

        // Check Requirements: settings.minSeasons with streak >= settings.minStreak
        const qualifyingStreaks = user.seasonStreaks.filter(s => s.streak >= minStreak);

        if (qualifyingStreaks.length >= minSeasons) {

            if (xpReward > 0) {
                user.xp = (user.xp || 0) + xpReward;
            }

            // Update claim status
            user.hasClaimedRoyalPass = true;
            user.lastRoyalPassClaimDate = new Date();

            await user.save();

            res.json({
                success: true,
                message: 'Royal Pass activated successfully!',
                xpGained: xpReward,
                user: { ...user._doc, password: '' }
            });
        } else {
            res.status(400).send(`Requirements not met. You have ${qualifyingStreaks.length}/${minSeasons} qualifying seasons (Min Streak: ${minStreak}).`);
        }

    } catch (err) {
        res.status(500).send(err.message || 'Claim failed');
    }
};

exports.claimReward = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        if (!user.unclaimedRewards || user.unclaimedRewards.length === 0) {
            return res.status(400).send('No rewards to claim');
        }

        // Claim the first reward (FIFO)
        const reward = user.unclaimedRewards.shift(); // Remove first element
        const xpToAdd = reward.xp;

        user.xp = (user.xp || 0) + xpToAdd;
        await user.save();

        res.json({
            success: true,
            message: `Claimed ${xpToAdd} XP for ${reward.reason}`,
            xpGained: xpToAdd,
            remainingRewards: user.unclaimedRewards.length,
            user: { ...user._doc, password: '' }
        });

    } catch (err) {
        res.status(500).send(err.message || 'Claim failed');
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const topXP = await User.find({ role: 'user' })
            .sort({ xp: -1 })
            .limit(5)
            .select('username xp profilePicture');

        const topStreak = await User.find({ role: 'user' })
            .sort({ overallStreak: -1 })
            .limit(5)
            .select('username overallStreak profilePicture');

        res.json({ topXP, topStreak });
    } catch (err) {
        res.status(500).send(err.message || 'Error fetching leaderboard');
    }
};

exports.spinWheel = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        if (user.role === 'admin') {
            return res.status(403).send('Admins cannot spin the wheel');
        }

        // Check Date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let spinCount = user.spinData?.count || 0;
        const lastSpin = user.spinData?.lastSpinDate ? new Date(user.spinData.lastSpinDate) : null;

        if (lastSpin) {
            lastSpin.setHours(0, 0, 0, 0);
            if (lastSpin.getTime() !== today.getTime()) {
                // New Day -> Reset
                spinCount = 0;
            }
        }

        if (spinCount >= 3) {
            return res.status(400).send('Daily spin limit reached (3/3)');
        }

        // Rewards Logic
        // 0 XP, 1 XP, 5 XP, 10 XP, 100 XP
        // Weights: 0 (20%), 1 (30%), 5 (30%), 10 (15%), 100 (5%)
        const random = Math.random() * 100;
        let rewardXp = 0;

        if (random < 20) rewardXp = 0;
        else if (random < 50) rewardXp = 1;
        else if (random < 80) rewardXp = 5;
        else if (random < 95) rewardXp = 10;
        else rewardXp = 100;

        if (rewardXp > 0) {
            user.xp = (user.xp || 0) + rewardXp;
        }

        // Update Spin Data
        user.spinData = {
            count: spinCount + 1,
            lastSpinDate: new Date()
        };

        await user.save();

        res.json({
            success: true,
            reward: rewardXp,
            spinsLeft: 3 - (spinCount + 1),
            totalXp: user.xp
        });

    } catch (err) {
        res.status(500).send(err.message || 'Spin failed');
    }
};

exports.getRoyalPassConfig = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings.royalPassConfig);
    } catch (err) {
        res.status(500).send(err.message || 'Error fetching config');
    }
};
