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
        required: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true
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
    claimedRoyalPasses: [{
        passId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoyalPass'
        },
        claimDate: {
            type: Date,
            default: Date.now
        }
    }],
    // Deprecated but kept for schema compatibility if needed, or we can just remove it.
    // Let's migrate logic to use claimedRoyalPasses.
    hasClaimedRoyalPass: {
        type: Boolean,
        default: false
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
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    sentFriendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
