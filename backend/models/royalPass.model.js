const mongoose = require('mongoose');

const RoyalPassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    xpReward: {
        type: Number,
        default: 200
    },
    minStreak: {
        type: Number,
        default: 3
    },
    minSeasons: {
        type: Number,
        default: 3
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('RoyalPass', RoyalPassSchema);
