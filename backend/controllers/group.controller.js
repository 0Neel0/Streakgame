const Group = require('../models/group.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

exports.createGroup = async (req, res) => {
    try {
        const { name, members, description } = req.body;
        const admin = req.user._id;

        if (!name) {
            return res.status(400).send("Group name is required");
        }

        // Add admin to members if not already included
        const initialMembers = members ? [...new Set([...members, admin.toString()])] : [admin];

        const newGroup = new Group({
            name,
            description,
            members: initialMembers,
            admin
        });

        await newGroup.save();

        // Populate members to return full user objects if needed, or just return the group
        await newGroup.populate('members', 'username profilePicture');

        res.status(201).json(newGroup);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate('members', 'username profilePicture')
            .populate('admin', 'username');
        res.json(groups);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ group: groupId })
            .populate('sender', 'username profilePicture')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.sendGroupMessage = async (req, res) => {
    try {
        const { groupId, content } = req.body;
        const senderId = req.user._id;

        const file = req.file;
        let fileUrl = '';
        let fileType = 'none';

        if (file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
            if (file.mimetype.startsWith('image/')) {
                fileType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                fileType = 'video';
            } else {
                fileType = 'document';
            }
        }

        if (!groupId || (!content && !file)) {
            return res.status(400).send("Group ID and content (or file) are required");
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).send("Group not found");

        // Check if sender is a member
        if (!group.members.includes(senderId)) {
            return res.status(403).send("You are not a member of this group");
        }

        const newMessage = new Message({
            sender: senderId,
            group: groupId,
            content: content || '',
            fileUrl,
            fileType
        });

        await newMessage.save();
        await newMessage.populate('sender', 'username profilePicture');

        // Socket.io: Emit message to group room
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('new_message', newMessage);
        }

        res.json(newMessage);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.addMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).send("Group not found");

        // Only admin can add members (or change logic if needed)
        // For now, let's allow any member to add? or just admin. 
        // Typically admin.
        if (group.admin.toString() !== requesterId.toString()) {
            return res.status(403).send("Only admin can add members");
        }

        if (group.members.includes(userId)) {
            return res.status(400).send("User already in group");
        }

        group.members.push(userId);
        await group.save();

        res.json(group);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).send("Group not found");

        if (group.admin.toString() !== requesterId.toString()) {
            return res.status(403).send("Only admin can remove members");
        }

        group.members = group.members.filter(memberId => memberId.toString() !== userId);
        await group.save();

        res.json(group);
    } catch (err) {
        res.status(500).send(err.message);
    }
};
