const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', require('../middleware/auth.middleware'), authController.getMe);

module.exports = router;

