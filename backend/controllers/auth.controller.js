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
    const effectiveDate = date ? new Date(date) : new Date();
    // console.log(`Login attempt for: ${email} on date: ${effectiveDate.toISOString()}`);

    const today = normalizeDate(effectiveDate);
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
    user.lastLoginDate = effectiveDate; // Save provided date or now

    // 2. Season Streak - REMOVED
    // Streak logic is now handled exclusively via explicit check-in per season.

    await user.save();

    // We need the latest state
    const updatedUser = await User.findById(user._id);

    const token = generateToken({ _id: updatedUser._id, role: updatedUser.role });
    res.header('auth-token', token).send({ token, user: { ...updatedUser._doc, password: '' } });
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(400).send(err);
    }
};
