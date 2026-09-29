/**
 * Registration Routes
 */
const express = require('express');
const router = express.Router();
const { registerForEvent, unregisterFromEvent, getMyRegistrations } = require('../controllers/registrationController');
const { verifyToken, requireStudent } = require('../middleware/auth');

router.get('/my', verifyToken, requireStudent, getMyRegistrations);
router.post('/:eventId', verifyToken, requireStudent, registerForEvent);
router.delete('/:eventId', verifyToken, requireStudent, unregisterFromEvent);

module.exports = router;
