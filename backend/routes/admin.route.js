const router = require('express').Router();
const verify = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Middleware to check if admin
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access Denied: Admins only');
    }
    next();
};

router.get('/users', verify, verifyAdmin, adminController.getAllUsers);
router.post('/season', verify, verifyAdmin, adminController.createSeason);
router.get('/seasons', verify, verifyAdmin, adminController.getAllSeasons);
router.put('/season/:id', verify, verifyAdmin, adminController.updateSeason);
router.delete('/season/:id', verify, verifyAdmin, adminController.deleteSeason);
router.get('/settings', verify, verifyAdmin, adminController.getSettings);
router.put('/settings', verify, verifyAdmin, adminController.updateSettings);

// Royal Pass Routes
router.get('/royal-pass', verify, verifyAdmin, adminController.getAllRoyalPasses);
router.post('/royal-pass', verify, verifyAdmin, adminController.createRoyalPass);
router.put('/royal-pass/:id', verify, verifyAdmin, adminController.updateRoyalPass);
router.delete('/royal-pass/:id', verify, verifyAdmin, adminController.deleteRoyalPass);

module.exports = router;
