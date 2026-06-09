const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getWeightLog } = require('../controllers/profileController');

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/weight-log', getWeightLog);

module.exports = router;
