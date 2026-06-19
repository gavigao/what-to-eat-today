const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, getWeightLog } = require('../controllers/profileController');

router.use(authenticate);
router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/weight-log', getWeightLog);

module.exports = router;
