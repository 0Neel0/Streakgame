const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const seasonController = require('../controllers/season.controller');

router.get('/active', verifyToken, seasonController.getActiveSeasons);
router.get('/', verifyToken, seasonController.getAllSeasons);
router.get('/:id', verifyToken, seasonController.getSeasonById);
router.post('/:id/checkin', verifyToken, seasonController.checkInSeason);
// Admin only for getting all users of a season
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
    next();
};
router.get('/:id/users', verifyToken, verifyAdmin, seasonController.getSeasonUsers);

module.exports = router;

