const router = require('express').Router();
const verify = require('../middleware/auth.middleware');
const seasonController = require('../controllers/season.controller');

router.get('/active', verify, seasonController.getActiveSeasons);
router.get('/', verify, seasonController.getAllSeasons);
router.get('/:id', verify, seasonController.getSeasonById);
router.post('/:id/checkin', verify, seasonController.checkInSeason);
// Admin only for getting all users of a season
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
    next();
};
router.get('/:id/users', verify, verifyAdmin, seasonController.getSeasonUsers);

module.exports = router;

