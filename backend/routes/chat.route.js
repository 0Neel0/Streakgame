const router = require('express').Router();
const chatController = require('../controllers/chat.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

const upload = require('../middleware/upload.middleware');

router.post('/send', upload.single('file'), chatController.sendMessage);
router.get('/history/:friendId', chatController.getMessages);
router.post('/read', chatController.markAsRead);
router.get('/unread', chatController.getFunctioningUnreadCounts);

module.exports = router;
