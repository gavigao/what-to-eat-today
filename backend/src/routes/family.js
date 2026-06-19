const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { createFamily, joinFamily, getMyFamily, leaveFamily, getFamilyMemberMeals } = require('../controllers/familyController');

const router = Router();

router.use(authenticate);
router.post('/create', createFamily);
router.post('/join', joinFamily);
router.get('/mine', getMyFamily);
router.post('/leave', leaveFamily);
router.get('/members/:userId/meals', getFamilyMemberMeals);

module.exports = router;
