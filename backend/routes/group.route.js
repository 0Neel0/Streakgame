const router = require('express').Router();
const groupController = require('../controllers/group.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/create', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:groupId/messages', groupController.getGroupMessages);
const upload = require('../middleware/upload.middleware');

router.post('/message', upload.single('file'), groupController.sendGroupMessage);
router.post('/add-member', groupController.addMember);
router.post('/remove-member', groupController.removeMember);

module.exports = router;
