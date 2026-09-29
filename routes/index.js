/**
 * Index Routes
 */
const express = require('express');
const router = express.Router();
const { getHome, getDashboard } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getHome);
router.get('/dashboard', verifyToken, getDashboard);

module.exports = router;
