/**
 * Event Controller
 * CRUD operations for events
 */
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { detectCategory, extractTags } = require('../config/aiService');

// GET /events - All events listing
exports.getAllEvents = async (req, res) => {
  try {
    const { category, search, sort, status } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status === 'past') filter.date = { $lt: new Date() };
    else if (status !== 'all') filter.date = { $gte: new Date() }; // Default: upcoming

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = { date: 1 }; // Default: soonest first
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { views: -1 };

    const events = await Event.find(filter)
      .populate('createdBy', 'name clubName')
      .sort(sortOption)
      .lean();

    // Get registration counts for each event
    const eventIds = events.map(e => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { event: { $in: eventIds }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);
    const regCountMap = {};
    regCounts.forEach(r => { regCountMap[r._id.toString()] = r.count; });

    // Get user's registrations if logged in
    let userRegistrations = [];
    if (req.user) {
      userRegistrations = await Registration.find({ user: req.user._id, status: { $ne: 'cancelled' } }).select('event');
    }
    const registeredEventIds = userRegistrations.map(r => r.event.toString());

    const eventsWithData = events.map(e => ({
      ...e,
      registrationCount: regCountMap[e._id.toString()] || 0,
      isRegistered: registeredEventIds.includes(e._id.toString())
    }));

    const categories = ['coding', 'music', 'dance', 'sports', 'art', 'literature', 'science', 'business', 'gaming', 'photography', 'drama', 'debate'];

    res.render('events/index', {
      title: 'All Events - CampusConnect',
      events: eventsWithData,
      categories,
      currentCategory: category || 'all',
      currentSort: sort || 'date',
      currentStatus: status || 'upcoming',
      searchQuery: search || ''
    });
  } catch (error) {
    console.error('Get events error:', error);
    req.flash('error', 'Failed to load events');
    res.redirect('/');
  }
};

// GET /events/:id - Single event detail
exports.getEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name clubName clubDescription avatar role');

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    // Increment view count
    await Event.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Get registration count and list
    const registrationCount = await Registration.countDocuments({ event: event._id, status: { $ne: 'cancelled' } });

    // Check if current user is registered
    let isRegistered = false;
    if (req.user) {
      const reg = await Registration.findOne({ user: req.user._id, event: event._id, status: { $ne: 'cancelled' } });
      isRegistered = !!reg;
    }

    // Get registered users (for club view)
    let registeredUsers = [];
    if (req.user && (req.user.role === 'club' || req.user.role === 'admin') &&
        event.createdBy._id.toString() === req.user._id.toString()) {
      registeredUsers = await Registration.find({ event: event._id, status: { $ne: 'cancelled' } })
        .populate('user', 'name email department year');
    }

    // Similar events
    const similarEvents = await Event.find({
      category: event.category,
      _id: { $ne: event._id },
      date: { $gte: new Date() }
    }).limit(3).lean();

    res.render('events/detail', {
      title: `${event.title} - CampusConnect`,
      event,
      registrationCount,
      isRegistered,
      registeredUsers,
      similarEvents,
      canEdit: req.user && event.createdBy._id.toString() === req.user._id.toString()
    });
  } catch (error) {
    console.error('Get event detail error:', error);
    req.flash('error', 'Failed to load event');
    res.redirect('/events');
  }
};

// GET /events/create - Create event form (club only)
exports.getCreateEvent = (req, res) => {
  res.render('events/create', {
    title: 'Create Event - CampusConnect',
    categories: ['coding', 'music', 'dance', 'sports', 'art', 'literature', 'science', 'business', 'gaming', 'photography', 'drama', 'debate', 'workshop', 'seminar', 'other']
  });
};

// POST /events/create
exports.postCreateEvent = async (req, res) => {
  try {
    const {
      title, description, date, time, venue, category,
      capacity, registrationDeadline, isPaid, fee,
      prizes, requirements, isPlacementRelated, companyName, jobRole
    } = req.body;

    // AI: Auto-detect category if not specified or use provided
    const detectedCategory = category || detectCategory(title, description);

    // AI: Auto-extract tags
    const tags = extractTags(title, description);

    // Handle poster upload (store filename if uploaded)
    let poster = '';
    if (req.file) {
      poster = `/uploads/${req.file.filename}`;
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      time,
      venue,
      category: detectedCategory,
      tags,
      poster,
      capacity: parseInt(capacity) || 100,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      isPaid: isPaid === 'on',
      fee: isPaid === 'on' ? parseFloat(fee) || 0 : 0,
      prizes,
      requirements,
      isPlacementRelated: isPlacementRelated === 'on',
      companyName: isPlacementRelated === 'on' ? companyName : undefined,
      jobRole: isPlacementRelated === 'on' ? jobRole : undefined,
      createdBy: req.user._id
    });

    // Add notification to all students who have matching interests
    const matchingStudents = await User.find({
      role: 'student',
      interests: detectedCategory
    });

    const notificationPromises = matchingStudents.map(student =>
      User.findByIdAndUpdate(student._id, {
        $push: {
          notifications: {
            message: `New event matching your interests: "${title}"`,
            type: 'info'
          }
        }
      })
    );
    await Promise.all(notificationPromises);

    req.flash('success', `Event "${title}" created successfully! 🎉 Tags auto-detected: ${tags.slice(0,3).join(', ')}`);
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    console.error('Create event error:', error);
    req.flash('error', 'Failed to create event: ' + error.message);
    res.redirect('/events/create');
  }
};

// GET /events/:id/edit
exports.getEditEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'You can only edit your own events');
      return res.redirect('/events');
    }

    res.render('events/edit', {
      title: 'Edit Event - CampusConnect',
      event,
      categories: ['coding', 'music', 'dance', 'sports', 'art', 'literature', 'science', 'business', 'gaming', 'photography', 'drama', 'debate', 'workshop', 'seminar', 'other']
    });
  } catch (error) {
    req.flash('error', 'Failed to load event');
    res.redirect('/events');
  }
};

// PUT /events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'Unauthorized');
      return res.redirect('/events');
    }

    const { title, description, date, time, venue, category, capacity, status } = req.body;

    // Re-extract tags if description changed
    const tags = extractTags(title, description);

    await Event.findByIdAndUpdate(req.params.id, {
      title, description, date: new Date(date), time, venue, category,
      tags, capacity: parseInt(capacity), status
    });

    req.flash('success', 'Event updated successfully!');
    res.redirect(`/events/${req.params.id}`);
  } catch (error) {
    req.flash('error', 'Failed to update event');
    res.redirect(`/events/${req.params.id}/edit`);
  }
};

// DELETE /events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'Unauthorized');
      return res.redirect('/events');
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });

    req.flash('success', 'Event deleted successfully');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Failed to delete event');
    res.redirect('/events');
  }
};
