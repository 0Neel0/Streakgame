const Message = require('../models/message.model');
const User = require('../models/user.model');

exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        if (!recipientId || !content) {
            return res.status(400).send("Recipient and content are required");
        }

        // Verify recipient exists and is a friend (optional strictness, but good for privacy)
        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).send("User not found");

        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content
        });

        await newMessage.save();

        // Populate sender details for immediate frontend display if needed
        await newMessage.populate('sender', 'username profilePicture');

        res.json(newMessage);

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // Fetch conversation between user and friend
        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: friendId },
                { sender: friendId, recipient: userId }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'username profilePicture');

        res.json(messages);

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user._id;

        // Update all unread messages from friend to user
        await Message.updateMany(
            { sender: friendId, recipient: userId, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getFunctioningUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate unread counts by sender
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    recipient: userId,
                    read: false
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(unreadCounts);
    } catch (err) {
        res.status(500).send(err.message);
    }
}
