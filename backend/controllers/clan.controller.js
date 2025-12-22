const Clan = require('../models/clan.model');
const User = require('../models/user.model');

/**
 * Create a new clan
 */
exports.createClan = async (req, res) => {
    try {
        const { name, description, seasonId } = req.body;
        const adminId = req.user._id;

        if (!name || name.trim() === '') {
            return res.status(400).send('Clan name is required');
        }

        const clan = new Clan({
            name: name.trim(),
            description: description ? description.trim() : '',
            admin: adminId,
            members: [adminId], // Admin is the first member
            seasonId: seasonId || null
        });

        await clan.save();

        // Add clan to user's clans array
        await User.findByIdAndUpdate(adminId, {
            $addToSet: { clans: clan._id }
        });

        const populatedClan = await Clan.findById(clan._id)
            .populate('admin', 'username profilePicture')
            .populate('members', 'username profilePicture')
            .populate('seasonId', 'name startDate endDate');

        res.json({
            success: true,
            message: 'Clan created successfully',
            clan: populatedClan
        });
    } catch (err) {
        console.error('Create Clan Error:', err);
        res.status(500).send(err.message || 'Failed to create clan');
    }
};

/**
 * Get clan details by ID
 */
exports.getClan = async (req, res) => {
    try {
        const clanId = req.params.id;
        const clan = await Clan.findById(clanId)
            .populate('admin', 'username profilePicture email')
            .populate('members', 'username profilePicture xp overallStreak')
            .populate('seasonId', 'name startDate endDate')
            .populate('activeSeasons', 'name startDate endDate');

        if (!clan) {
            return res.status(404).send('Clan not found');
        }

        res.json(clan);
    } catch (err) {
        console.error('Get Clan Error:', err);
        res.status(500).send(err.message || 'Failed to get clan');
    }
};

/**
 * Get all clans for the authenticated user
 */
exports.getUserClans = async (req, res) => {
    try {
        const userId = req.user._id;

        const clans = await Clan.find({ members: userId })
            .populate('admin', 'username profilePicture')
            .populate('seasonId', 'name startDate endDate')
            .populate('activeSeasons', 'name startDate endDate')
            .sort({ createdAt: -1 });

        // Add member count to each clan
        const clansWithCount = clans.map(clan => ({
            ...clan._doc,
            memberCount: clan.members.length
        }));

        res.json(clansWithCount);
    } catch (err) {
        console.error('Get User Clans Error:', err);
        res.status(500).send(err.message || 'Failed to get clans');
    }
};

/**
 * Join a clan by ID
 */
exports.joinClan = async (req, res) => {
    try {
        const clanId = req.params.id;
        const userId = req.user._id;

        const clan = await Clan.findById(clanId);
        if (!clan) {
            return res.status(404).send('Clan not found');
        }

        // Check if already a member
        if (clan.members.includes(userId)) {
            return res.status(400).send('You are already a member of this clan');
        }

        // Add user to clan members
        clan.members.push(userId);
        await clan.save();

        // Add clan to user's clans array
        await User.findByIdAndUpdate(userId, {
            $addToSet: { clans: clan._id }
        });

        // Notify clan admin
        const notificationService = require('../services/notification.service');
        const user = await User.findById(userId).select('username');
        const io = req.app.get('io');

        await notificationService.createNotification(
            clan.admin,
            'clan_join',
            `${user.username} joined your clan "${clan.name}"`,
            { clanId: clan._id, clanName: clan.name, username: user.username }
        );

        if (io) {
            const notification = await notificationService.createNotification(
                clan.admin,
                'clan_join',
                `${user.username} joined your clan "${clan.name}"`,
                { clanId: clan._id, clanName: clan.name, username: user.username }
            );
            notificationService.emitNotification(io, clan.admin, notification);
        }

        const populatedClan = await Clan.findById(clanId)
            .populate('admin', 'username profilePicture')
            .populate('members', 'username profilePicture')
            .populate('seasonId', 'name startDate endDate');

        res.json({
            success: true,
            message: 'Successfully joined clan',
            clan: populatedClan
        });
    } catch (err) {
        console.error('Join Clan Error:', err);
        res.status(500).send(err.message || 'Failed to join clan');
    }
};

/**
 * Leave a clan
 */
exports.leaveClan = async (req, res) => {
    try {
        const clanId = req.params.id;
        const userId = req.user._id;

        const clan = await Clan.findById(clanId);
        if (!clan) {
            return res.status(404).send('Clan not found');
        }

        // Admin cannot leave their own clan
        if (clan.admin.toString() === userId.toString()) {
            return res.status(400).send('Clan admin cannot leave. Delete the clan instead.');
        }

        // Check if user is a member
        if (!clan.members.includes(userId)) {
            return res.status(400).send('You are not a member of this clan');
        }

        // Remove user from clan members
        clan.members = clan.members.filter(m => m.toString() !== userId.toString());
        await clan.save();

        // Remove clan from user's clans array
        await User.findByIdAndUpdate(userId, {
            $pull: { clans: clan._id }
        });

        // Notify clan admin
        const notificationService = require('../services/notification.service');
        const user = await User.findById(userId).select('username');
        const io = req.app.get('io');

        const notification = await notificationService.createNotification(
            clan.admin,
            'clan_leave',
            `${user.username} left your clan "${clan.name}"`,
            { clanId: clan._id, clanName: clan.name, username: user.username }
        );

        if (io) {
            notificationService.emitNotification(io, clan.admin, notification);
        }

        res.json({
            success: true,
            message: 'Successfully left clan'
        });
    } catch (err) {
        console.error('Leave Clan Error:', err);
        res.status(500).send(err.message || 'Failed to leave clan');
    }
};

/**
 * Remove a member from clan (admin only)
 */
exports.removeMember = async (req, res) => {
    try {
        const clanId = req.params.id;
        const memberId = req.params.memberId;
        const adminId = req.user._id;

        const clan = await Clan.findById(clanId);
        if (!clan) {
            return res.status(404).send('Clan not found');
        }

        // Check if requester is the admin
        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can remove members');
        }

        // Cannot remove self
        if (memberId === adminId.toString()) {
            return res.status(400).send('Cannot remove yourself. Delete the clan instead.');
        }

        // Check if user is a member
        if (!clan.members.includes(memberId)) {
            return res.status(400).send('User is not a member of this clan');
        }

        // Remove member
        clan.members = clan.members.filter(m => m.toString() !== memberId);
        await clan.save();

        // Remove clan from user's clans array
        await User.findByIdAndUpdate(memberId, {
            $pull: { clans: clan._id }
        });

        // Notify the removed member
        const notificationService = require('../services/notification.service');
        const io = req.app.get('io');

        const notification = await notificationService.createNotification(
            memberId,
            'clan_removed',
            `You have been removed from clan "${clan.name}"`,
            { clanId: clan._id, clanName: clan.name }
        );

        if (io) {
            notificationService.emitNotification(io, memberId, notification);
        }

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (err) {
        console.error('Remove Member Error:', err);
        res.status(500).send(err.message || 'Failed to remove member');
    }
};

/**
 * Delete a clan (admin only)
 */
exports.deleteClan = async (req, res) => {
    try {
        const clanId = req.params.id;
        const adminId = req.user._id;

        const clan = await Clan.findById(clanId);
        if (!clan) {
            return res.status(404).send('Clan not found');
        }

        // Check if requester is the admin
        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can delete the clan');
        }

        // Remove clan from all members' clans arrays
        await User.updateMany(
            { clans: clanId },
            { $pull: { clans: clanId } }
        );

        // Delete the clan
        await Clan.findByIdAndDelete(clanId);

        res.json({
            success: true,
            message: 'Clan deleted successfully'
        });
    } catch (err) {
        console.error('Delete Clan Error:', err);
        res.status(500).send(err.message || 'Failed to delete clan');
    }
};

/**
 * Update clan details (admin only)
 */
exports.updateClan = async (req, res) => {
    try {
        const clanId = req.params.id;
        const adminId = req.user._id;
        const { name, description, seasonId, activeSeasons } = req.body;

        const clan = await Clan.findById(clanId);
        if (!clan) return res.status(404).send('Clan not found');

        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can update details');
        }

        if (name) clan.name = name.trim();
        if (description !== undefined) clan.description = description.trim();

        // Handle deprecated seasonId for backward compatibility
        if (seasonId !== undefined) {
            clan.seasonId = seasonId || null;
            // Sync with activeSeasons if only seasonId is provided
            if (seasonId && (!activeSeasons || activeSeasons.length === 0)) {
                clan.activeSeasons = [seasonId];
            }
        }

        // Handle multi-season support
        if (activeSeasons !== undefined) {
            clan.activeSeasons = activeSeasons;
            // Sync deprecated seasonId to the first active season (for display purposes)
            if (activeSeasons.length > 0) {
                clan.seasonId = activeSeasons[0];
            } else {
                clan.seasonId = null;
            }
        }

        await clan.save();

        // Return populated clan to update frontend state immediately
        const populatedClan = await Clan.findById(clanId)
            .populate('admin', 'username profilePicture email')
            .populate('members', 'username profilePicture xp overallStreak')
            .populate('seasonId', 'name startDate endDate')
            .populate('activeSeasons', 'name startDate endDate');

        res.json({ success: true, message: 'Clan updated successfully', clan: populatedClan });
    } catch (err) {
        res.status(500).send(err.message || 'Failed to update clan');
    }
};

/**
 * Send announcement to all clan members (admin only)
 */
exports.sendAnnouncement = async (req, res) => {
    try {
        const clanId = req.params.id;
        const adminId = req.user._id;
        const { message } = req.body;

        if (!message) return res.status(400).send('Message is required');

        const clan = await Clan.findById(clanId);
        if (!clan) return res.status(404).send('Clan not found');

        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can send announcements');
        }

        const notificationService = require('../services/notification.service');
        const io = req.app.get('io');
        const adminUser = await User.findById(adminId).select('username');

        // Send to all members except sender (admin)
        // usage: createNotification(userId, type, message, data)
        const notifications = clan.members
            .filter(m => m.toString() !== adminId.toString())
            .map(memberId => notificationService.createNotification(
                memberId,
                'clan_announcement',
                `📢 Announcement from ${clan.name}: ${message}`,
                {
                    clanId: clan._id,
                    clanName: clan.name,
                    senderName: adminUser.username,
                    announcement: message
                }
            ));

        // Wait for all DB creations
        const createdNotifications = await Promise.all(notifications);

        // Emit real-time events
        if (io) {
            createdNotifications.forEach(notification => {
                notificationService.emitNotification(io, notification.userId, notification);
            });
        }

        res.json({ success: true, message: 'Announcement sent successfully' });
    } catch (err) {
        res.status(500).send(err.message || 'Failed to send announcement');
    }
};

/**
 * Transfer clan ownership (admin only)
 */
exports.transferOwnership = async (req, res) => {
    try {
        const clanId = req.params.id;
        const adminId = req.user._id;
        const { newAdminId } = req.body;

        const clan = await Clan.findById(clanId);
        if (!clan) return res.status(404).send('Clan not found');

        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can transfer ownership');
        }

        if (!clan.members.includes(newAdminId)) {
            return res.status(400).send('New admin must be a member of the clan');
        }

        clan.admin = newAdminId;
        await clan.save();

        // Notify new admin
        const notificationService = require('../services/notification.service');
        const io = req.app.get('io');

        const notif = await notificationService.createNotification(
            newAdminId,
            'clan_ownership',
            `👑 You are now the owner of clan "${clan.name}"!`,
            { clanId: clan._id, clanName: clan.name }
        );

        if (io) notificationService.emitNotification(io, newAdminId, notif);

        res.json({ success: true, message: 'Ownership transferred successfully', clan });
    } catch (err) {
        res.status(500).send(err.message || 'Failed to transfer ownership');
    }
};

/**
 * Squad Check-in: Check in all members for all active seasons
 */
exports.squadCheckIn = async (req, res) => {
    try {
        const clanId = req.params.id;
        const adminId = req.user._id;
        const streakService = require('../services/streak.service');
        const notificationService = require('../services/notification.service');
        const io = req.app.get('io');

        const clan = await Clan.findById(clanId)
            .populate('activeSeasons')
            .populate('seasonId'); // Fallback

        if (!clan) return res.status(404).send('Clan not found');

        if (clan.admin.toString() !== adminId.toString()) {
            return res.status(403).send('Only clan admin can perform Squad Check-in');
        }

        let seasonsToCheck = [];
        if (clan.activeSeasons && clan.activeSeasons.length > 0) {
            seasonsToCheck = clan.activeSeasons;
        } else if (clan.seasonId) {
            seasonsToCheck = [clan.seasonId];
        }

        if (seasonsToCheck.length === 0) {
            return res.status(400).send('No active seasons assigned to this clan');
        }

        const checkInDate = new Date();
        let totalCheckIns = 0;

        // Perform check-ins
        for (const season of seasonsToCheck) {
            for (const memberId of clan.members) {
                try {
                    await streakService.checkInUserToSeason(memberId, season._id, checkInDate);
                    totalCheckIns++;
                } catch (e) {
                    // Ignore "Already checked in" or specific errors per user to keep loop going
                    console.log(`Check-in skipped for user ${memberId} in season ${season.name}: ${e.message}`);
                }
            }
        }

        // Notify members
        // To avoid spam, we'll send one notification per member summarizing functionality
        const adminUser = await User.findById(adminId).select('username');

        const notificationPromises = clan.members
            .filter(id => id.toString() !== adminId.toString())
            .map(memberId => notificationService.createNotification(
                memberId,
                'clan_checkin',
                `${adminUser.username} performed a Squad Check-in for ${seasonsToCheck.length} season(s)!`,
                {
                    clanId: clan._id,
                    clanName: clan.name,
                    adminName: adminUser.username,
                    seasonCount: seasonsToCheck.length
                }
            ));

        const createdNotifications = await Promise.all(notificationPromises);

        if (io) {
            createdNotifications.forEach(n => {
                notificationService.emitNotification(io, n.userId, n);
            });
        }

        res.json({
            success: true,
            message: `Squad Check-in complete! Processed ${totalCheckIns} check-ins across ${seasonsToCheck.length} seasons.`
        });

    } catch (err) {
        console.error('Squad Check-in Error:', err);
        res.status(500).send(err.message || 'Failed to perform Squad Check-in');
    }
};
