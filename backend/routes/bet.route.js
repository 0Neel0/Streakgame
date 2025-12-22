const router = require('express').Router();
const betController = require('../controllers/bet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Create bet
router.post('/create', betController.createBet);

// Get active bet
router.get('/active', betController.getActiveBet);

// Get bet history
router.get('/history', betController.getBetHistory);

module.exports = router;
