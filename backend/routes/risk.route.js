const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/status', verifyToken, riskController.getRisk);

module.exports = router;
