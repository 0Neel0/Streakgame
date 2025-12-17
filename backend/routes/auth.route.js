
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/github', authController.githubLogin);
router.get('/me', verifyToken, authController.getMe);
router.post('/update', verifyToken, authController.updateProfile);
router.post('/claim-royal-pass', verifyToken, authController.claimRoyalPass);
router.get('/royal-passes', verifyToken, authController.getActiveRoyalPasses);
router.post('/claim-reward', verifyToken, authController.claimReward);
router.get('/leaderboard', verifyToken, authController.getLeaderboard);
router.post('/spin', verifyToken, authController.spinWheel);
router.get('/settings', verifyToken, authController.getRoyalPassConfig);

const upload = require('../utils/cloudinary');

const uploadMiddleware = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary Error:', err);
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }
        next();
    });
};

router.post('/upload-avatar', verifyToken, uploadMiddleware, authController.uploadAvatar);

module.exports = router;
