const express = require('express');
const router = express.Router();
const { searchFoods, getCategories, createFood, deleteFood } = require('../controllers/foodsController');

router.get('/search', searchFoods);
router.get('/categories', getCategories);
router.post('/', createFood);
router.delete('/:id', deleteFood);

module.exports = router;
