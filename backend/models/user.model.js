const mongoose = require('mongoose');

const SeasonStreakSchema = new mongoose.Schema({
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

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    overallStreak: {
        type: Number,
        default: 0
    },
    lastLoginDate: {
        type: Date,
        default: null
    },
    seasonStreaks: [SeasonStreakSchema],
    xp: {
        type: Number,
        default: 0
    },
    profilePicture: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    hasClaimedRoyalPass: {
        type: Boolean,
        default: false
    },
    lastRoyalPassClaimDate: {
        type: Date,
        default: null
    },
    unclaimedRewards: [{
        xp: Number,
        reason: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    spinData: {
        count: {
            type: Number,
            default: 0
        },
        lastSpinDate: {
            type: Date,
            default: null
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
