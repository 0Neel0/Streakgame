const mongoose = require('mongoose');

const UserSeasonSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seasonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        required: true
    },
    streak: {
        type: Number,
        default: 0
    },
    lastLoginDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure a user can only have one entry per season
UserSeasonSchema.index({ userId: 1, seasonId: 1 }, { unique: true });

module.exports = mongoose.model('UserSeason', UserSeasonSchema);
