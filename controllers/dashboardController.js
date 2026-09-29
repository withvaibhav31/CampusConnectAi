/**
 * Dashboard Controller
 * Home page, dashboard, recommendations
 */
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { getRecommendations } = require('../config/aiService');

// GET / - Home page
exports.getHome = async (req, res) => {
  try {
    // Featured events (upcoming, recent)
    const featuredEvents = await Event.find({ date: { $gte: new Date() } })
      .populate('createdBy', 'name clubName')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Get registration counts
    const eventIds = featuredEvents.map(e => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { event: { $in: eventIds }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);
    const regCountMap = {};
    regCounts.forEach(r => { regCountMap[r._id.toString()] = r.count; });

    const eventsWithCounts = featuredEvents.map(e => ({
      ...e,
      registrationCount: regCountMap[e._id.toString()] || 0
    }));

    // Stats
    const totalEvents = await Event.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClubs = await User.countDocuments({ role: 'club' });
    const totalRegistrations = await Registration.countDocuments({ status: { $ne: 'cancelled' } });

    // Categories for quick filter
    const categories = ['coding', 'music', 'dance', 'sports', 'art', 'science', 'business', 'gaming'];

    res.render('index', {
      title: 'CampusConnect AI - Your Campus Events Hub',
      featuredEvents: eventsWithCounts,
      stats: { totalEvents, totalStudents, totalClubs, totalRegistrations },
      categories
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('index', {
      title: 'CampusConnect AI',
      featuredEvents: [],
      stats: { totalEvents: 0, totalStudents: 0, totalClubs: 0, totalRegistrations: 0 },
      categories: []
    });
  }
};

// GET /dashboard - User dashboard
exports.getDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (req.user.role === 'club' || req.user.role === 'admin') {
      // Club dashboard
      const myEvents = await Event.find({ createdBy: req.user._id })
        .sort({ date: 1 })
        .lean();

      const eventIds = myEvents.map(e => e._id);
      const regCounts = await Registration.aggregate([
        { $match: { event: { $in: eventIds }, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$event', count: { $sum: 1 } } }
      ]);
      const regCountMap = {};
      regCounts.forEach(r => { regCountMap[r._id.toString()] = r.count; });

      const eventsWithCounts = myEvents.map(e => ({
        ...e,
        registrationCount: regCountMap[e._id.toString()] || 0
      }));

      const totalRegistrations = Object.values(regCountMap).reduce((a, b) => a + b, 0);

      return res.render('dashboard/club', {
        title: 'Club Dashboard - CampusConnect',
        myEvents: eventsWithCounts,
        totalRegistrations,
        upcomingEvents: eventsWithCounts.filter(e => new Date(e.date) >= new Date()),
        pastEvents: eventsWithCounts.filter(e => new Date(e.date) < new Date())
      });
    }

    // Student dashboard
    const myRegistrations = await Registration.find({
      user: req.user._id,
      status: { $ne: 'cancelled' }
    }).populate('event').sort({ registeredAt: -1 });

    const upcomingRegistrations = myRegistrations.filter(r => r.event && new Date(r.event.date) >= new Date());

    // All upcoming events for recommendations
    const allEvents = await Event.find({ date: { $gte: new Date() } })
      .populate('createdBy', 'name clubName')
      .lean();

    // Get registration counts for recommendations
    const allEventIds = allEvents.map(e => e._id);
    const allRegCounts = await Registration.aggregate([
      { $match: { event: { $in: allEventIds }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);
    const allRegCountMap = {};
    allRegCounts.forEach(r => { allRegCountMap[r._id.toString()] = r.count; });
    const allEventsWithCounts = allEvents.map(e => ({
      ...e,
      registrationCount: allRegCountMap[e._id.toString()] || 0
    }));

    // AI Recommendations
    const recommendedEvents = await getRecommendations(req.user, allEventsWithCounts, myRegistrations);

    // Mark notifications as read
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].read': true }
    });

    res.render('dashboard/student', {
      title: 'Dashboard - CampusConnect',
      myRegistrations: upcomingRegistrations.slice(0, 5),
      recommendedEvents: recommendedEvents.slice(0, 6),
      totalRegistrations: myRegistrations.length,
      notifications: req.user.notifications?.slice().reverse().slice(0, 5) || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};
