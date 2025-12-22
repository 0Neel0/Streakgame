const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    betType: {
        type: String,
        enum: ['solo', 'friend_challenge'],
        default: 'solo'
    },
    // Friend challenge fields
    opponentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    challengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    challengeStatus: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'active', 'completed'],
        default: 'pending'
    },
    acceptedAt: {
        type: Date
    },
    // Bet details
    amount: {
        type: Number,
        required: true,
        min: 10
    },
    multiplier: {
        type: Number,
        default: 2
    },
    // Date-based betting
    betStartDate: {
        type: Date,
        default: Date.now
    },
    betEndDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'won', 'lost', 'tied'],
        default: 'active'
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    streakAtBet: {
        type: Number,
        required: true
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for faster queries
BetSchema.index({ userId: 1, status: 1 });
BetSchema.index({ opponentId: 1, challengeStatus: 1 });
BetSchema.index({ challengerId: 1, challengeStatus: 1 });

module.exports = mongoose.model('Bet', BetSchema);
