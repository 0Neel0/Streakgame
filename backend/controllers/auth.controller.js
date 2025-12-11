const User = require('../models/user.model');
const Season = require('../models/season.model');
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
    const { email, password, date } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email is not found');

    // Validate Password
    const validPass = await comparePassword(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // --- STREAK LOGIC ---
    const today = normalizeDate(date ? new Date(date) : new Date());
    const lastLogin = user.lastLoginDate ? normalizeDate(user.lastLoginDate) : null;
    let overallStreak = user.overallStreak;

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

    user.overallStreak = overallStreak;
    user.lastLoginDate = date ? new Date(date) : new Date(); // Save provided date or now

    // 2. Season Streak - REMOVED
    // Streak logic is now handled exclusively via explicit check-in per season.


    await user.save();

    const token = generateToken({ _id: user._id, role: user.role });
    res.header('auth-token', token).send({ token, user: { ...user._doc, password: '' } });
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(400).send(err);
    }
};
