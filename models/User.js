/**
 * User Model
 * Handles both students and club admins
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['student', 'club', 'admin'],
    default: 'student'
  },
  // Student-specific fields
  interests: [{
    type: String,
    enum: ['coding', 'music', 'dance', 'sports', 'art', 'literature', 'science', 'business', 'gaming', 'photography', 'drama', 'debate']
  }],
  department: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1,
    max: 5
  },
  // Club-specific fields
  clubName: {
    type: String,
    trim: true
  },
  clubDescription: {
    type: String,
    trim: true
  },
  clubCategory: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'social', 'academic', 'other']
  },
  avatar: {
    type: String,
    default: ''
  },
  notifications: [{
    message: String,
    type: { type: String, enum: ['info', 'success', 'warning'], default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for unread notification count
UserSchema.virtual('unreadNotifications').get(function() {
  return this.notifications.filter(n => !n.read).length;
});

module.exports = mongoose.model('User', UserSchema);
