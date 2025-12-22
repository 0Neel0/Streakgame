const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const protect = require('../middleware/auth.middleware');

router.get('/status', protect, riskController.getRisk);

module.exports = router;
