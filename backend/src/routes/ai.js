const express = require('express');
const router = express.Router();
const { analyze, getAnalysis, estimateFood } = require('../controllers/aiController');

router.post('/analyze', analyze);
router.get('/analysis', getAnalysis);
router.post('/estimate-food', estimateFood);

module.exports = router;
