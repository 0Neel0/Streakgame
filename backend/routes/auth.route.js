
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.post('/update', verifyToken, authController.updateProfile);
router.post('/claim-royal-pass', verifyToken, authController.claimRoyalPass);
router.post('/claim-reward', verifyToken, authController.claimReward);
router.get('/leaderboard', verifyToken, authController.getLeaderboard);
router.post('/spin', verifyToken, authController.spinWheel);
router.get('/settings', verifyToken, authController.getRoyalPassConfig);

module.exports = router;
