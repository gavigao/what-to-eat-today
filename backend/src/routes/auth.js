const { Router } = require('express');
const { register, login, refresh, logout, updateAccount } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.put('/account', authenticate, updateAccount);
router.post('/logout', authenticate, logout);

module.exports = router;
