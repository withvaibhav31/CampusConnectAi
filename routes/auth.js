/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { getLogin, getSignup, postLogin, postSignup, logout, getProfile, updateProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/signup', getSignup);
router.post('/signup', postSignup);
router.get('/logout', logout);
router.get('/profile', verifyToken, getProfile);
router.post('/profile', verifyToken, updateProfile);

module.exports = router;
