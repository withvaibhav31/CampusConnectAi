/**
 * Registration Controller
 * Handles event registrations
 */
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');

// POST /registrations/:eventId - Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    // Check if event is in future
    if (new Date() > new Date(event.date)) {
      req.flash('error', 'This event has already passed');
      return res.redirect(`/events/${event._id}`);
    }

    // Check capacity
    const regCount = await Registration.countDocuments({ event: event._id, status: { $ne: 'cancelled' } });
    if (regCount >= event.capacity) {
      req.flash('error', 'Sorry, this event is full!');
      return res.redirect(`/events/${event._id}`);
    }

    // Check if already registered
    const existing = await Registration.findOne({ user: req.user._id, event: event._id });
    if (existing) {
      if (existing.status === 'cancelled') {
        // Re-register
        existing.status = 'registered';
        existing.registeredAt = new Date();
        await existing.save();
        req.flash('success', `Re-registered for "${event.title}"! 🎉`);
      } else {
        req.flash('error', 'You are already registered for this event');
      }
      return res.redirect(`/events/${event._id}`);
    }

    await Registration.create({ user: req.user._id, event: event._id });

    // Notify the club
    await User.findByIdAndUpdate(event.createdBy, {
      $push: {
        notifications: {
          message: `${req.user.name} registered for "${event.title}"`,
          type: 'success'
        }
      }
    });

    req.flash('success', `Successfully registered for "${event.title}"! 🎉`);
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'You are already registered for this event');
    } else {
      console.error('Registration error:', error);
      req.flash('error', 'Registration failed. Please try again.');
    }
    res.redirect(`/events/${req.params.eventId}`);
  }
};

// DELETE /registrations/:eventId - Unregister
exports.unregisterFromEvent = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user._id,
      event: req.params.eventId
    });

    if (!registration) {
      req.flash('error', 'Registration not found');
      return res.redirect('/dashboard');
    }

    registration.status = 'cancelled';
    await registration.save();

    req.flash('success', 'Successfully unregistered from the event');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Failed to unregister');
    res.redirect('/dashboard');
  }
};

// GET /registrations/my - My registrations
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user._id,
      status: { $ne: 'cancelled' }
    })
    .populate('event')
    .sort({ registeredAt: -1 });

    const upcoming = registrations.filter(r => r.event && new Date(r.event.date) >= new Date());
    const past = registrations.filter(r => r.event && new Date(r.event.date) < new Date());

    res.render('dashboard/my-registrations', {
      title: 'My Registrations - CampusConnect',
      upcoming,
      past
    });
  } catch (error) {
    console.error('My registrations error:', error);
    req.flash('error', 'Failed to load registrations');
    res.redirect('/dashboard');
  }
};
