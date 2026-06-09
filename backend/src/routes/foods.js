const express = require('express');
const router = express.Router();
const { searchFoods, getCategories, createFood } = require('../controllers/foodsController');

router.get('/search', searchFoods);
router.get('/categories', getCategories);
router.post('/', createFood);

module.exports = router;
