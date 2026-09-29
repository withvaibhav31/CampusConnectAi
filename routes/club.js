/**
 * Club Routes
 */
const express = require('express');
const router = express.Router();
const { verifyToken, requireClub } = require('../middleware/auth');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// GET /club/dashboard
router.get('/dashboard', verifyToken, requireClub, async (req, res) => {
  res.redirect('/dashboard');
});

// GET /club/events/:eventId/attendees
//kis event m kitne aur kon konse attendess hai ye dekhna ho toh 
router.get('/events/:eventId/attendees', verifyToken, requireClub, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event || event.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error', 'Unauthorized');
      return res.redirect('/dashboard');
    }
    const attendees = await Registration.find({ event: event._id, status: { $ne: 'cancelled' } })
      .populate('user', 'name email department year');
    res.render('club/attendees', { title: 'Attendees - CampusConnect', event, attendees });
  } catch (err) {
    req.flash('error', 'Failed to load attendees');
    res.redirect('/dashboard');
  }
});

module.exports = router;
