const User = require('../models/user.model');
const Season = require('../models/season.model');
const Settings = require('../models/settings.model');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }, '-password').sort({ overallStreak: -1 });
        res.json(users);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.createSeason = async (req, res) => {
    const { name, startDate, endDate } = req.body;

    // Basic validation
    if (!name || !startDate || !endDate) {
        return res.status(400).send('Name, StartDate, and EndDate are required');
    }

    const season = new Season({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
    });

    try {
        const savedSeason = await season.save();
        res.send(savedSeason);
    } catch (err) {
        res.status(400).send(err.message || 'Error creating season');
    }
};

exports.getAllSeasons = async (req, res) => {
    try {
        const seasons = await Season.find().sort({ startDate: -1 });

        // Count users for each season
        const seasonsWithCount = await Promise.all(seasons.map(async (season) => {
            const count = await User.countDocuments({ 'seasonStreaks.seasonId': season._id });
            return {
                ...season._doc,
                userCount: count
            };
        }));

        res.json(seasonsWithCount);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.updateSeason = async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    try {
        const season = await Season.findByIdAndUpdate(id, {
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        }, { new: true });
        res.json(season);
    } catch (err) {
        res.status(400).send(err.message || 'Error updating season');
    }
};

exports.deleteSeason = async (req, res) => {
    const { id } = req.params;
    try {
        await Season.findByIdAndDelete(id);
        res.json({ message: 'Season deleted successfully' });
    } catch (err) {
        res.status(400).send(err.message || 'Error deleting season');
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).send(err.message || 'Error fetching settings');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const { royalPassConfig } = req.body;

        if (royalPassConfig) {
            if (royalPassConfig.minStreak !== undefined) settings.royalPassConfig.minStreak = royalPassConfig.minStreak;
            if (royalPassConfig.minSeasons !== undefined) settings.royalPassConfig.minSeasons = royalPassConfig.minSeasons;
            if (royalPassConfig.xpReward !== undefined) settings.royalPassConfig.xpReward = royalPassConfig.xpReward;
        }

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).send(err.message || 'Error updating settings');
    }
};
