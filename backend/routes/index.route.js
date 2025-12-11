const express = require('express');
const authRoutes = require('./auth.route');
const adminRoutes = require('./admin.route');
const seasonRoutes = require('./season.route');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/season', seasonRoutes);

module.exports = router;
