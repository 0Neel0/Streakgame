const router = require('express').Router();
const friendsController = require('../controllers/friends.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/search', friendsController.searchUsers);
router.get('/list', friendsController.getFriends);
router.get('/requests', friendsController.getFriendRequests);

router.post('/request', friendsController.sendFriendRequest);
router.post('/cancel', friendsController.cancelFriendRequest);
router.post('/accept', friendsController.acceptFriendRequest);
router.post('/reject', friendsController.rejectFriendRequest);
router.post('/transfer', friendsController.transferXP);

module.exports = router;
