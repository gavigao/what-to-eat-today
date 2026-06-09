const express = require('express');
const router = express.Router();
const { getMeals, createMeal, deleteMeal, getSummary, getTrend, getMonthly, getMealDetails } = require('../controllers/mealsController');

router.get('/monthly', getMonthly);
router.get('/details', getMealDetails);
router.get('/summary', getSummary);
router.get('/trend', getTrend);
router.get('/', getMeals);
router.post('/', createMeal);
router.delete('/:id', deleteMeal);

module.exports = router;
