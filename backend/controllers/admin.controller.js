const User = require('../models/user.model');
const Season = require('../models/season.model');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ overallStreak: -1 });
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
        res.json(seasons);
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
