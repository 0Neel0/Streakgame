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

module.exports = router;
