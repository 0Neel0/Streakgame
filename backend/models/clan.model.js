const mongoose = require('mongoose');

const ClanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    seasonId: { // Deprecated: keeping for backward compatibility
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        default: null
    },
    activeSeasons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster queries
ClanSchema.index({ admin: 1 });
ClanSchema.index({ members: 1 });
ClanSchema.index({ seasonId: 1 });

module.exports = mongoose.model('Clan', ClanSchema);
