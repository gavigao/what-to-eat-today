const express = require('express');
const router = express.Router();
const { analyze, getAnalysis, estimateFood, recommend } = require('../controllers/aiController');

router.post('/analyze', analyze);
router.get('/analysis', getAnalysis);
router.post('/estimate-food', estimateFood);
router.post('/recommend', recommend);

module.exports = router;
