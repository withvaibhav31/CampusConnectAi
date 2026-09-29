/**
 * API Routes
 * Chatbot, recommendations, auto-tag detection
 */
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { getChatbotResponse, detectCategory, extractTags, getRecommendations } = require('../config/aiService');
const { verifyToken } = require('../middleware/auth');

// POST /api/chatbot
router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ error: 'No message provided' });

    const events = await Event.find({ date: { $gte: new Date() } }).lean();
    const response = await getChatbotResponse(message, events);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: 'Chatbot error', response: 'Sorry, I am having trouble right now. Please try again!' });
  }
});

// POST /api/detect-category
router.post('/detect-category', async (req, res) => {
  try {
    const { title, description } = req.body;
    const category = detectCategory(title || '', description || '');
    const tags = extractTags(title || '', description || '');
    res.json({ category, tags });
  } catch (err) {
    res.status(500).json({ error: 'Detection failed' });
  }
});

// GET /api/recommendations
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const allEvents = await Event.find({ date: { $gte: new Date() } }).lean();
    const userRegs = await Registration.find({ user: req.user._id }).populate('event');
    const recommendations = await getRecommendations(req.user, allEvents, userRegs);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Recommendations failed' });
  }
});

// GET /api/events/search
router.get('/events/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ events: [] });
    const events = await Event.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      date: { $gte: new Date() }
    }).limit(5).select('title category date venue').lean();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
