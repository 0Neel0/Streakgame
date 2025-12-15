const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    royalPassConfig: {
        minStreak: { type: Number, default: 3 },
        minSeasons: { type: Number, default: 3 },
        xpReward: { type: Number, default: 200 }
    }
}, { timestamps: true });

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);
