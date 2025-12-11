const Season = require('../models/season.model');

exports.getActiveSeasons = async (req, res) => {
    try {
        const currentDate = new Date();
        // Set to beginning of the day to ensure seasons starting today or ending today are included
        currentDate.setHours(0, 0, 0, 0);

        const activeSeasons = await Season.find({
            startDate: { $lte: new Date() }, // Started in the past or now
            endDate: { $gte: currentDate }, // Ends today or in future. Using start of today ensuring even if it ends at 00:00 it counts for today.
            isActive: true
        });
        res.json(activeSeasons);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.getAllSeasons = async (req, res) => {
    try {
        const seasons = await Season.find({ isActive: true }).sort({ startDate: -1 });
        res.json(seasons);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.getSeasonById = async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) return res.status(404).send('Season not found');
        res.json(season);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.checkInSeason = async (req, res) => {
    const userId = req.user._id;
    const seasonId = req.params.id;

    // Support 'date' or 'lastLoginDate' from body or query
    let date = req.body.date || req.body.lastLoginDate || req.query.date || req.query.lastLoginDate;

    // Validate if provided
    if (date && isNaN(new Date(date).getTime())) {
        console.warn(`Invalid date provided to checkIn: ${date}`);
        date = null;
    }
    const streakService = require('../services/streak.service');

    try {
        const result = await streakService.checkInUserToSeason(userId, seasonId, date);
        res.json(result);
    } catch (err) {
        // console.error(err); // Optional logging
        if (err.message === 'User not found' || err.message === 'Season not found') {
            return res.status(404).send(err.message);
        }
        if (err.message === 'Season is not currently active') {
            return res.status(400).send(err.message);
        }
        res.status(400).send(err.message || 'Error checking in');
    }
};

exports.getSeasonUsers = async (req, res) => {
    const seasonId = req.params.id;
    const User = require('../models/user.model');
    const mongoose = require('mongoose');

    try {
        console.log(`Fetching users for season: ${seasonId}`);

        // Find users where seasonStreaks.seasonId matches
        // Explicitly cast to ObjectId
        const users = await User.find({
            'seasonStreaks.seasonId': new mongoose.Types.ObjectId(seasonId)
        }, 'username seasonStreaks');

        console.log(`Found ${users.length} users for season ${seasonId}`);

        const seasonUsers = users.map(user => {
            const streakData = user.seasonStreaks.find(s => s.seasonId.toString() === seasonId);
            return {
                _id: user._id,
                username: user.username,
                streak: streakData ? streakData.streak : 0,
                lastLogin: streakData ? streakData.lastLoginDate : null
            };
        });

        seasonUsers.sort((a, b) => b.streak - a.streak);

        res.json(seasonUsers);
    } catch (err) {
        console.error("Error in getSeasonUsers:", err);
        res.status(400).send(err.message || 'Error fetching season users');
    }
};
