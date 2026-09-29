/**
 * AI Service
 * Recommendation engine, auto-tagging, and chatbot logic
 */

// ─── Keyword Maps for Auto-Tagging ─────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  coding: ['code', 'coding', 'programming', 'hackathon', 'software', 'algorithm', 'web', 'app', 'developer', 'javascript', 'python', 'java', 'react', 'node', 'html', 'css', 'database', 'api', 'github', 'tech', 'ml', 'ai', 'machine learning', 'data science'],
  music: ['music', 'band', 'concert', 'singing', 'guitar', 'piano', 'melody', 'rhythm', 'acoustic', 'performance', 'choir', 'orchestra', 'jam', 'lyrics', 'songwriter'],
  dance: ['dance', 'dancing', 'choreography', 'ballet', 'hip hop', 'salsa', 'contemporary', 'folk', 'classical dance', 'bharatanatyam', 'freestyle'],
  sports: ['sports', 'cricket', 'football', 'basketball', 'volleyball', 'tennis', 'badminton', 'chess', 'tournament', 'match', 'game', 'athlete', 'fitness', 'gym', 'running', 'marathon'],
  art: ['art', 'painting', 'drawing', 'sketch', 'sculpture', 'craft', 'design', 'illustration', 'canvas', 'exhibit', 'gallery', 'creative', 'calligraphy'],
  science: ['science', 'research', 'experiment', 'physics', 'chemistry', 'biology', 'astronomy', 'robotics', 'innovation', 'invention', 'laboratory', 'stem'],
  business: ['business', 'entrepreneurship', 'startup', 'finance', 'marketing', 'management', 'investment', 'pitch', 'case study', 'mba', 'leadership'],
  gaming: ['gaming', 'game', 'esports', 'tournament', 'pubg', 'valorant', 'minecraft', 'playstation', 'xbox', 'pc gaming', 'mobile gaming'],
  photography: ['photography', 'photo', 'camera', 'portrait', 'landscape', 'editing', 'lightroom', 'photoshop', 'lens', 'shoot', 'capture'],
  drama: ['drama', 'theater', 'theatre', 'play', 'acting', 'skit', 'script', 'stage', 'performance', 'mime', 'monologue', 'dialogue'],
  debate: ['debate', 'discussion', 'moot', 'public speaking', 'elocution', 'speech', 'argument', 'panel', 'conference', 'symposium'],
  literature: ['literature', 'poetry', 'writing', 'story', 'novel', 'essay', 'book', 'reading', 'author', 'creative writing', 'quiz', 'spelling']
};

/**
 * Auto-detect event category from title + description
 */
const detectCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category] += keyword.split(' ').length; // Multi-word keywords score higher
      }
    }
  }

  // Find category with highest score
  const bestCategory = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
  return bestCategory[1] > 0 ? bestCategory[0] : 'other';
};

/**
 * Extract tags from event description
 */
const extractTags = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const tags = new Set();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) && keyword.length > 3) {
        tags.add(keyword);
      }
    }
  }

  // Extract capitalized proper nouns (basic NER)
  const words = `${title} ${description}`.match(/\b[A-Z][a-z]+\b/g) || [];
  words.slice(0, 5).forEach(w => tags.add(w.toLowerCase()));

  return [...tags].slice(0, 10); // Max 10 tags
};

/**
 * Generate personalized event recommendations for a student
 * Based on: interests + past registrations + category matching
 */
 


//const getRecommendations = (user, allEvents, userRegistrations) => {

//   const interests = user.interests || [];

//   const pastCategories = userRegistrations.map(r => r.event.category);

//   const recommended = allEvents
//     .filter(event => new Date(event.date) > new Date())

//     .map(event => {
//       let score = 0;

//       if (interests.includes(event.category)) {
//         score += 3;
//       }

//       if (pastCategories.includes(event.category)) {
//         score += 2;
//       }

//       return { event, score };
//     })

//     .sort((a, b) => b.score - a.score);

//   return recommended.map(item => item.event).slice(0, 6);
// };
const getRecommendations = async (user, allEvents, userRegistrations) => {
  if (!user || user.role !== 'student') return allEvents.slice(0, 6);

  const registeredEventIds = userRegistrations.map(r => r.event._id?.toString() || r.event?.toString());
  const interests = user.interests || [];

  // Get categories from past registrations
  const pastCategories = userRegistrations
    .filter(r => r.event && r.event.category)
    .map(r => r.event.category);

  // Score each event
  const scoredEvents = allEvents
    .filter(e => !registeredEventIds.includes(e._id.toString())) // Exclude already registered
    .filter(e => new Date(e.date) > new Date()) // Only upcoming
    .map(event => {
      let score = 0;

      // +3 if matches user interests
      if (interests.includes(event.category)) score += 3;

      // +2 if matches past registration categories
      if (pastCategories.includes(event.category)) score += 2;

      // +1 for recent events (within 30 days)
      const daysUntil = (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntil <= 30) score += 1;

      // +1 for events with high registrations (popular)
      if (event.registrationCount > 20) score += 1;

      // Tag matching with interests
      const eventTags = event.tags || [];
      const interestKeywords = interests.flatMap(i => CATEGORY_KEYWORDS[i] || []);
      const tagMatches = eventTags.filter(t => interestKeywords.includes(t)).length;
      score += tagMatches * 0.5;

      return { event, score };
    })
    .sort((a, b) => b.score - a.score);

  return scoredEvents.map(s => s.event).slice(0, 6);
};

/**
 * Simple rule-based chatbot response
 */
const getChatbotResponse = async (query, events) => {
  const q = query.toLowerCase().trim();

  // Greeting
  if (/^(hi|hello|hey|howdy|sup)/i.test(q)) {
    return "Hey there! 👋 I'm CampusBot, your AI event assistant! Ask me about events, categories, registrations, or anything campus-related!";
  }

  // Help
  if (q.includes('help') || q.includes('what can you do')) {
    return `I can help you with:\n• 🔍 **Find events** - "Show coding events"\n• 📅 **Upcoming events** - "What's happening this week?"\n• 🏆 **Popular events** - "Show popular events"\n• 📌 **Categories** - Ask about any category (music, sports, tech, etc.)\n• 💼 **Placement events** - "Show placement events"`;
  }

  // Category-based event search
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => q.includes(k)) || q.includes(category)) {
      const categoryEvents = events.filter(e => e.category === category && new Date(e.date) > new Date());
      if (categoryEvents.length === 0) {
        return `No upcoming ${category} events found right now. Check back soon! 🔔`;
      }
      const eventList = categoryEvents.slice(0, 3).map(e =>
        `• **${e.title}** - ${new Date(e.date).toLocaleDateString()} at ${e.venue}`
      ).join('\n');
      return `Here are upcoming **${category}** events:\n${eventList}\n\nWant to see more? Check the events page! 🎯`;
    }
  }

  // Upcoming events
  if (q.includes('upcoming') || q.includes('this week') || q.includes('soon')) {
    const upcoming = events
      .filter(e => new Date(e.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
    if (upcoming.length === 0) return "No upcoming events right now. Stay tuned! 📅";
    const list = upcoming.map(e => `• **${e.title}** - ${new Date(e.date).toLocaleDateString()}`).join('\n');
    return `Upcoming events:\n${list}`;
  }

  // Popular events
  if (q.includes('popular') || q.includes('trending') || q.includes('best')) {
    const popular = events
      .filter(e => new Date(e.date) > new Date())
      .sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0))
      .slice(0, 3);
    if (popular.length === 0) return "No events found! 🤔";
    const list = popular.map(e => `• **${e.title}** - ${e.registrationCount || 0} registered`).join('\n');
    return `Most popular upcoming events:\n${list}`;
  }

  // Placement events
  if (q.includes('placement') || q.includes('job') || q.includes('career') || q.includes('company')) {
    const placementEvents = events.filter(e => e.isPlacementRelated && new Date(e.date) > new Date());
    if (placementEvents.length === 0) return "No placement events scheduled right now. 💼";
    const list = placementEvents.slice(0, 3).map(e =>
      `• **${e.title}** by ${e.companyName || 'Campus Placement Cell'} - ${new Date(e.date).toLocaleDateString()}`
    ).join('\n');
    return `Upcoming placement events:\n${list}`;
  }

  // Count events
  if (q.includes('how many') || q.includes('count') || q.includes('total')) {
    const upcoming = events.filter(e => new Date(e.date) > new Date()).length;
    return `There are currently **${upcoming} upcoming events** on CampusConnect! 🎊`;
  }

  // Registration question
  if (q.includes('register') || q.includes('sign up') || q.includes('join')) {
    return "To register for an event:\n1. Go to the **Events** page\n2. Click on an event you like\n3. Hit the **Register** button!\n\nIt's that simple! 🎯";
  }

  // Default response
  const allUpcoming = events.filter(e => new Date(e.date) > new Date());
  return `I found **${allUpcoming.length} upcoming events** on campus! Try asking me:\n• "Show coding events"\n• "What's happening this week?"\n• "Show music events"\n\nOr browse all events on the Events page! 🚀`;
};

module.exports = { detectCategory, extractTags, getRecommendations, getChatbotResponse };
