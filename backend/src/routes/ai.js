const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkAiQuota } = require('../middleware/aiQuota');
const { analyze, getAnalysis, estimateFood, recommend } = require('../controllers/aiController');

router.use(authenticate);
// 只读查询不消耗配额
router.get('/analysis', getAnalysis);
// AI 调用需检查配额
router.post('/analyze', checkAiQuota, analyze);
router.post('/estimate-food', checkAiQuota, estimateFood);
router.post('/recommend', checkAiQuota, recommend);

module.exports = router;
