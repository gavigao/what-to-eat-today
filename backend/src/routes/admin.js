const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  listUsers, deleteUser, generateInviteCodes, listInviteCodes, deactivateInviteCode,
} = require('../controllers/adminController');

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.post('/invite-codes', generateInviteCodes);
router.get('/invite-codes', listInviteCodes);
router.post('/invite-codes/:id/deactivate', deactivateInviteCode);

module.exports = router;
