const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const Season = require('./backend/models/season.model');

require('dotenv').config({ path: './backend/.env' });

async function debugUserStreaks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`\nUser: ${user.username} (${user.role})`);
            console.log(`Has Claimed: ${user.hasClaimedRoyalPass}`);
            console.log("Season Streaks:");
            if (user.seasonStreaks && user.seasonStreaks.length > 0) {
                user.seasonStreaks.forEach(s => {
                    console.log(`  - SeasonId: ${s.seasonId} | Streak: ${s.streak}`);
                });
                const qualifying = user.seasonStreaks.filter(s => s.streak >= 3).length;
                console.log(`  => Qualifying Seasons (>3 days): ${qualifying}`);
            } else {
                console.log("  No season streaks recorded.");
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugUserStreaks();
