/**
 * Auth Controller
 * Handles login, signup, logout
 */
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// GET /auth/login
exports.getLogin = (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login - CampusConnect' });
};

// GET /auth/signup
exports.getSignup = (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/signup', { title: 'Sign Up - CampusConnect' });
};

// POST /auth/signup
exports.postSignup = async (req, res) => {
  try {
    const { name, email, password, role, interests, department, year, clubName, clubDescription, clubCategory } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered. Please login.');
      return res.redirect('/auth/login');
    }

    // Build user data
    const userData = { name, email, password, role: role || 'student' };

    if (role === 'student') {
      userData.department = department;
      userData.year = parseInt(year) || 1;
      // Handle interests as array
      if (interests) {
        userData.interests = Array.isArray(interests) ? interests : [interests];
      }
    } else if (role === 'club') {
      userData.clubName = clubName;
      userData.clubDescription = clubDescription;
      userData.clubCategory = clubCategory;
    }

    const user = await User.create(userData);

    // Generate token and set cookie
    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    req.flash('success', `Welcome to CampusConnect, ${user.name}! 🎉`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Signup error:', error);
    req.flash('error', error.message || 'Signup failed. Please try again.');
    res.redirect('/auth/signup');
  }
};

// POST /auth/login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please provide email and password');
      return res.redirect('/auth/login');
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Check password------userSchema mai h ye function 
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Generate token-----jwt m h ye function
    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.flash('success', `Welcome back, ${user.name}! 👋`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
};

// GET /auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully. See you soon!');
  res.redirect('/');
};

// GET /auth/profile - Update profile
exports.getProfile = async (req, res) => {
  res.render('auth/profile', { title: 'My Profile - CampusConnect', user: req.user });
};

// POST /auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, year, interests } = req.body;
    const updateData = { name };

    if (req.user.role === 'student') {
      updateData.department = department;
      updateData.year = parseInt(year);
      updateData.interests = Array.isArray(interests) ? interests : interests ? [interests] : [];
    }

    await User.findByIdAndUpdate(req.user._id, updateData);
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/auth/profile');
  } catch (error) {
    req.flash('error', 'Failed to update profile.');
    res.redirect('/auth/profile');
  }
};
