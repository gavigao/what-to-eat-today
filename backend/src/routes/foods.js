const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { searchFoods, getCategories, createFood, deleteFood } = require('../controllers/foodsController');

// 搜索和分类公开，创建和删除需认证
router.get('/search', searchFoods);
router.get('/categories', getCategories);
router.post('/', authenticate, createFood);
router.delete('/:id', authenticate, deleteFood);

module.exports = router;
