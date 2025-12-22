const express = require('express');
const authRoutes = require('./auth.route');
const adminRoutes = require('./admin.route');
const seasonRoutes = require('./season.route');
const friendsRoutes = require('./friends.route');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/season', seasonRoutes);
router.use('/friends', friendsRoutes);
router.use('/chat', require('./chat.route'));
router.use('/groups', require('./group.route'));
router.use('/risk', require('./risk.route'));


module.exports = router;
