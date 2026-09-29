/**
 * Authentication Middleware
 * JWT verification for protected routes
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token from cookie (required - redirects if not authenticated)
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      req.flash('error', 'Please log in to access this page');
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusconnect_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.clearCookie('token');
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/auth/login');
    }

    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    req.flash('error', 'Session expired. Please log in again.');
    res.redirect('/auth/login');
  }
};

/**
 * Verify JWT token optionally (doesn't redirect if not authenticated)
 */
const verifyTokenOptional = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusconnect_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (user) req.user = user;
    next();
  } catch (error) {
    // Token invalid - continue without user
    next();
  }
};

/**
 * Require student role
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  if (req.user.role !== 'student') {
    req.flash('error', 'Access denied. Students only.');
    return res.redirect('/');
  }
  next();
};

/**
 * Require club/admin role
 */
const requireClub = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  if (req.user.role !== 'club' && req.user.role !== 'admin') {
    req.flash('error', 'Access denied. Club accounts only.');
    return res.redirect('/');
  }
  next();
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admins only.');
    return res.redirect('/');
  }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'campusconnect_secret', {
    expiresIn: '7d'
  });
};

module.exports = { verifyToken, verifyTokenOptional, requireStudent, requireClub, requireAdmin, generateToken };
