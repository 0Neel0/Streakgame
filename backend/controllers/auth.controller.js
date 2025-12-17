const User = require('../models/user.model');
const Season = require('../models/season.model');
const Settings = require('../models/settings.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

exports.googleLogin = async (req, res) => {
    const { token, googleAccessToken } = req.body;
    try {
        let name, email, picture, googleId;

        if (googleAccessToken) {
            // Option 1: Verify Access Token by fetching UserInfo
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${googleAccessToken}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data with access token');
            }

            const data = await response.json();
            name = data.name;
            email = data.email;
            picture = data.picture;
            googleId = data.sub;

        } else if (token) {
            // Option 2: Verify ID Token
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
            googleId = payload.sub;
        } else {
            return res.status(400).send('No token provided');
        }

        let user = await User.findOne({ email });

        if (user) {
            // User exists, update googleId if not present (linking accounts)
            if (!user.googleId) {
                user.googleId = googleId;
            }
            // Update profile picture if empty
            if (!user.profilePicture) {
                user.profilePicture = picture;
            }
        } else {
            // New user, create account
            // Generate a unique username based on name + random suffix if needed? 
            // Or just use name and check for collision.
            let username = name.replace(/\s+/g, '').toLowerCase();
            let usernameExists = await User.findOne({ username });
            if (usernameExists) {
                username += Math.floor(Math.random() * 10000);
            }

            user = new User({
                username,
                email,
                googleId,
                profilePicture: picture,
                role: 'user'
            });
        }

        // Update login date logic similar to normal login
        const effectiveDate = new Date();
        // Capture old login date BEFORE updating
        const oldLastLoginDate = user.lastLoginDate;

        user.lastLoginDate = effectiveDate;

        // Overall Streak Logic (Copying from login)
        let xpGained = 0;
        let overallStreak = user.overallStreak;
        const today = normalizeDate(effectiveDate);

        if (user.role !== 'admin') {
            const lastLogin = oldLastLoginDate ? normalizeDate(oldLastLoginDate) : null;

            if (lastLogin) {
                const diffTime = Math.abs(today - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    overallStreak += 1;
                } else if (diffDays > 1) {
                    overallStreak = 1;
                }
            } else {
                overallStreak = 1;
            }

            // XP Logic
            let incremented = false;
            if (lastLogin) {
                const diffTime = Math.abs(today - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) incremented = true;
            } else {
                if (overallStreak === 1 && !lastLogin) incremented = true; // First login ever
            }

            if (incremented) {
                if (overallStreak > 0 && overallStreak % 10 === 0) {
                    user.unclaimedRewards.push({ xp: 100, reason: `10 Day Global Streak` });
                } else if (overallStreak > 0 && overallStreak % 5 === 0) {
                    user.unclaimedRewards.push({ xp: 50, reason: `5 Day Global Streak` });
                }
            }
            user.overallStreak = overallStreak;
        }

        await user.save();

        const authToken = generateToken({ _id: user._id, role: user.role });
        res.header('auth-token', authToken).send({ token: authToken, user: { ...user._doc, password: '' }, xpGained });

    } catch (err) {
        console.error('Google Login Error:', err);
        res.status(400).send('Google Login Failed');
    }
};

exports.githubLogin = async (req, res) => {
    const { code } = req.body;
    try {
        // 1. Exchange Code for Token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            throw new Error(tokenData.error_description || 'Failed to exchange code for token');
        }

        const accessToken = tokenData.access_token;

        // 2. Fetch User Profile
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` }
        });
        const userData = await userResponse.json();

        // 3. Fetch Email (if private)
        let email = userData.email;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `token ${accessToken}` }
            });
            const emails = await emailResponse.json();
            const primaryEmail = emails.find(e => e.primary && e.verified);
            if (primaryEmail) email = primaryEmail.email;
        }

        if (!email) {
            return res.status(400).send('No verified email found on GitHub account');
        }

        const githubId = userData.id.toString();
        const username = userData.login;
        const picture = userData.avatar_url;

        // 4. Find or Create User
        let user = await User.findOne({ email });

        if (user) {
            if (!user.githubId) user.githubId = githubId;
            if (!user.profilePicture) user.profilePicture = picture;
        } else {
            // Check username collision
            let finalUsername = username;
            let usernameExists = await User.findOne({ username: finalUsername });
            if (usernameExists) {
                finalUsername += Math.floor(Math.random() * 10000);
            }

            user = new User({
                username: finalUsername,
                email,
                githubId,
                profilePicture: picture,
                role: 'user'
            });
        }

        // 5. Update Login/Streak Logic (Reused)
        const effectiveDate = new Date();
        const oldLastLoginDate = user.lastLoginDate;
        user.lastLoginDate = effectiveDate;

        let xpGained = 0;
        let overallStreak = user.overallStreak;
        const today = normalizeDate(effectiveDate);

        if (user.role !== 'admin') {
            const lastLogin = oldLastLoginDate ? normalizeDate(oldLastLoginDate) : null;
            if (lastLogin) {
                const diffTime = Math.abs(today - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) overallStreak += 1;
                else if (diffDays > 1) overallStreak = 1;
            } else {
                overallStreak = 1;
            }

            // XP Logic
            let incremented = false;
            if (lastLogin) {
                const diffTime = Math.abs(today - lastLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) incremented = true;
            } else {
                if (overallStreak === 1 && !lastLogin) incremented = true;
            }

            if (incremented) {
                if (overallStreak > 0 && overallStreak % 10 === 0) {
                    user.unclaimedRewards.push({ xp: 100, reason: `10 Day Global Streak` });
                } else if (overallStreak > 0 && overallStreak % 5 === 0) {
                    user.unclaimedRewards.push({ xp: 50, reason: `5 Day Global Streak` });
                }
            }
            user.overallStreak = overallStreak;
        }

        await user.save();

        const authToken = generateToken({ _id: user._id, role: user.role });
        res.header('auth-token', authToken).send({ token: authToken, user: { ...user._doc, password: '' }, xpGained });

    } catch (err) {
        console.error('GitHub Login Error:', err);
        res.status(400).json({ message: 'GitHub Login Failed', error: err.message, details: err.response?.data });
    }
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

exports.getActiveRoyalPasses = async (req, res) => {
    try {
        const RoyalPass = require('../models/royalPass.model');
        const passes = await RoyalPass.find({ isActive: true }).sort({ xpReward: 1 });
        res.json(passes);
    } catch (err) {
        res.status(500).send(err.message || 'Error fetching royal passes');
    }
};

exports.claimRoyalPass = async (req, res) => {
    try {
        const userId = req.user._id;
        const { passId } = req.body;

        if (!passId) return res.status(400).send('Royal Pass ID is required');

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');
        if (user.role === 'admin') return res.status(403).send('Admins cannot claim Royal Pass');

        const RoyalPass = require('../models/royalPass.model');
        const pass = await RoyalPass.findById(passId);
        if (!pass || !pass.isActive) return res.status(404).send('Royal Pass not available');

        // Check if already claimed and if renewable
        const existingClaim = user.claimedRoyalPasses.find(c => c.passId.toString() === passId);

        if (existingClaim) {
            const lastClaim = new Date(existingClaim.claimDate);
            const now = new Date();
            const diffTime = Math.abs(now - lastClaim);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 10) {
                return res.status(400).send(`Pass already active. Renewable in ${10 - diffDays} days.`);
            }
            // If >= 10 days, we allow re-claim (extend or reset logic can be applied here)
            // For now, we update the existing claim date
            existingClaim.claimDate = new Date();
        } else {
            // New Claim
            // Check Requirements
            const minStreak = pass.minStreak;
            const minSeasons = pass.minSeasons;

            const qualifyingStreaks = user.seasonStreaks.filter(s => s.streak >= minStreak);

            if (qualifyingStreaks.length < minSeasons) {
                return res.status(400).send(`Requirements not met. You have ${qualifyingStreaks.length}/${minSeasons} qualifying seasons (Min Streak: ${minStreak}).`);
            }

            user.claimedRoyalPasses.push({
                passId: passId,
                claimDate: new Date()
            });

            // Legacy support (optional, can be removed if specific logic depends on it)
            if (!user.hasClaimedRoyalPass) {
                user.hasClaimedRoyalPass = true;
                user.lastRoyalPassClaimDate = new Date();
            }
        }

        // Reward XP
        if (pass.xpReward > 0) {
            user.xp = (user.xp || 0) + pass.xpReward;
        }

        await user.save();

        res.json({
            success: true,
            message: `Royal Pass '${pass.name}' activated!`,
            xpGained: pass.xpReward,
            user: { ...user._doc, password: '' }
        });

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

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');

        const userId = req.user._id;
        const user = await User.findById(userId);

        // Cloudinary returns the secure_url in req.file.path
        const fullUrl = req.file.path;

        user.profilePicture = fullUrl;
        await user.save();

        res.json({ success: true, profilePicture: fullUrl });
    } catch (err) {
        console.error('Upload Error Details:', err);
        res.status(500).send(err.message || 'Upload failed');
    }
};
