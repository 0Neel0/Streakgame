const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Middleware to check if admin
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access Denied: Admins only');
    }
    next();
};

router.get('/users', verifyToken, verifyAdmin, adminController.getAllUsers);
router.post('/season', verifyToken, verifyAdmin, adminController.createSeason);
router.get('/seasons', verifyToken, verifyAdmin, adminController.getAllSeasons);
router.put('/season/:id', verifyToken, verifyAdmin, adminController.updateSeason);
router.delete('/season/:id', verifyToken, verifyAdmin, adminController.deleteSeason);
router.get('/settings', verifyToken, verifyAdmin, adminController.getSettings);
router.put('/settings', verifyToken, verifyAdmin, adminController.updateSettings);

// Royal Pass Routes
router.get('/royal-pass', verifyToken, verifyAdmin, adminController.getAllRoyalPasses);
router.post('/royal-pass', verifyToken, verifyAdmin, adminController.createRoyalPass);
router.put('/royal-pass/:id', verifyToken, verifyAdmin, adminController.updateRoyalPass);
router.delete('/royal-pass/:id', verifyToken, verifyAdmin, adminController.deleteRoyalPass);

module.exports = router;
