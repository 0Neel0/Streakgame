const User = require('../models/user.model');

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // Search by username, exclude self
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id },
            role: 'user' // Only search normal users? Or allow searching admins too? Usually just users.
        }).select('username profilePicture xp overallStreak friends friendRequests');

        // Map status for the requesting user
        const results = users.map(u => {
            const isFriend = u.friends.includes(req.user._id);
            const hasRequested = u.friendRequests.some(r => r.from.toString() === req.user._id.toString());
            const hasIncoming = req.user.friendRequests?.some(r => r.from.toString() === u._id.toString()); // Needs context, but we can handle on frontend or check against DB if we fetch fresh current user.

            return {
                _id: u._id,
                username: u.username,
                profilePicture: u.profilePicture,
                xp: u.xp,
                overallStreak: u.overallStreak,
                status: isFriend ? 'friend' : hasRequested ? 'pending' : 'none'
            };
        });

        res.json(results);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.sendFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const senderId = req.user._id;

        if (targetUserId === senderId.toString()) return res.status(400).send("Cannot add self");

        const targetUser = await User.findById(targetUserId);
        const senderUser = await User.findById(senderId);

        if (!targetUser || !senderUser) return res.status(404).send("User not found");

        // Check if already friends
        if (senderUser.friends.includes(targetUserId)) return res.status(400).send("Already friends");

        // Check if already requested
        const existingReq = targetUser.friendRequests.find(r => r.from.toString() === senderId.toString());
        if (existingReq) return res.status(400).send("Request already sent");

        // Update Target
        targetUser.friendRequests.push({ from: senderId });
        await targetUser.save();

        // Update Sender
        senderUser.sentFriendRequests.push(targetUserId);
        await senderUser.save();

        res.json({ success: true, message: "Friend request sent" });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.cancelFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const senderId = req.user._id;

        const targetUser = await User.findById(targetUserId);
        const senderUser = await User.findById(senderId);

        if (!targetUser || !senderUser) return res.status(404).send("User not found");

        // Remove from Target's incoming
        targetUser.friendRequests = targetUser.friendRequests.filter(r => r.from.toString() !== senderId.toString());
        await targetUser.save();

        // Remove from Sender's sent
        senderUser.sentFriendRequests = senderUser.sentFriendRequests.filter(id => id.toString() !== targetUserId.toString());
        await senderUser.save();

        res.json({ success: true, message: "Request cancelled" });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user || !requester) return res.status(404).send("User not found");

        // Helper to check existence
        const reqIndex = user.friendRequests.findIndex(r => r.from.toString() === requesterId.toString());
        if (reqIndex === -1) return res.status(400).send("No request found");

        // Add to friends
        user.friends.addToSet(requesterId);
        requester.friends.addToSet(userId);

        // Remove request
        user.friendRequests.splice(reqIndex, 1);

        // Remove from sent list of requester
        requester.sentFriendRequests = requester.sentFriendRequests.filter(id => id.toString() !== userId.toString());

        await user.save();
        await requester.save();

        res.json({ success: true, message: "Friend added" });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.rejectFriendRequest = async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user) return res.status(404).send("User not found");

        // Remove request
        user.friendRequests = user.friendRequests.filter(r => r.from.toString() !== requesterId.toString());
        await user.save();

        // Remove from sent list of requester
        if (requester) {
            requester.sentFriendRequests = requester.sentFriendRequests.filter(id => id.toString() !== userId.toString());
            await requester.save();
        }

        res.json({ success: true, message: "Request rejected" });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'username profilePicture xp overallStreak');

        // Deduplicate friends list
        const uniqueFriends = user.friends.filter((friend, index, self) =>
            index === self.findIndex((t) => (
                t._id.toString() === friend._id.toString()
            ))
        );

        res.json(uniqueFriends);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests.from', 'username profilePicture xp');
        // Filter out nulls if user deleted
        const activeRequests = user.friendRequests.filter(r => r.from !== null);
        res.json(activeRequests);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.transferXP = async (req, res) => {
    try {
        const { targetUserId, amount } = req.body;
        const senderId = req.user._id;

        // Validation
        if (!amount || amount <= 0) return res.status(400).send("Invalid amount");
        if (targetUserId === senderId.toString()) return res.status(400).send("Cannot send XP to self");

        const sender = await User.findById(senderId);
        const recipient = await User.findById(targetUserId);

        if (!sender || !recipient) return res.status(404).send("User not found");

        // Check verification (Must be friends) - Optional but good practice
        if (!sender.friends.includes(targetUserId)) {
            return res.status(403).send("You can only send XP to friends");
        }

        // Check Balance
        if ((sender.xp || 0) < amount) {
            return res.status(400).send("Insufficient XP balance");
        }

        // Execute Transfer
        sender.xp -= amount;
        recipient.xp = (recipient.xp || 0) + amount;

        // Optional: Add notification or history log here if needed

        await sender.save();
        await recipient.save();

        res.json({
            success: true,
            message: `Successfully sent ${amount} XP to ${recipient.username}`,
            newBalance: sender.xp
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Transfer failed: " + err.message);
    }
};
