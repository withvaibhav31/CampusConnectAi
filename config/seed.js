/**
 * Database Seeder
 * Run: node config/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create club accounts
  const clubs = await User.create([
    {
      name: 'CodeCraft Club',
      email: 'codecraft@campus.edu',
      password: 'password123',
      role: 'club',
      clubName: 'CodeCraft Club',
      clubDescription: 'The premier technical coding club of the campus, organizing hackathons and workshops.',
      clubCategory: 'technical'
    },
    {
      name: 'Rhythm & Soul',
      email: 'rhythm@campus.edu',
      password: 'password123',
      role: 'club',
      clubName: 'Rhythm & Soul',
      clubDescription: 'Music and cultural club celebrating all forms of artistic expression.',
      clubCategory: 'cultural'
    },
    {
      name: 'Sports Committee',
      email: 'sports@campus.edu',
      password: 'password123',
      role: 'club',
      clubName: 'Sports Committee',
      clubDescription: 'Organizing all sports events and tournaments across the campus.',
      clubCategory: 'sports'
    },
    {
      name: 'E-Cell Campus',
      email: 'ecell@campus.edu',
      password: 'password123',
      role: 'club',
      clubName: 'Entrepreneurship Cell',
      clubDescription: 'Fostering startup culture and entrepreneurial mindset among students.',
      clubCategory: 'academic'
    }
  ]);
  console.log(`✅ Created ${clubs.length} club accounts`);

  // Create student accounts
  const students = await User.create([
    {
      name: 'Arjun Sharma',
      email: 'arjun@student.edu',
      password: 'password123',
      role: 'student',
      interests: ['coding', 'gaming', 'science'],
      department: 'Computer Science',
      year: 2
    },
    {
      name: 'Priya Patel',
      email: 'priya@student.edu',
      password: 'password123',
      role: 'student',
      interests: ['music', 'dance', 'art'],
      department: 'Fine Arts',
      year: 3
    },
    {
      name: 'Rahul Gupta',
      email: 'rahul@student.edu',
      password: 'password123',
      role: 'student',
      interests: ['sports', 'coding', 'business'],
      department: 'Mechanical Engineering',
      year: 1
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha@student.edu',
      password: 'password123',
      role: 'student',
      interests: ['debate', 'literature', 'business'],
      department: 'MBA',
      year: 2
    }
  ]);
  console.log(`✅ Created ${students.length} student accounts`);

  // Create events
  const now = new Date();
  const events = await Event.create([
    {
      title: 'HackVerse 2024 - 36 Hour Hackathon',
      description: 'Join our epic 36-hour hackathon! Build innovative apps, solve real-world problems, and compete for prizes worth ₹50,000. Open to all students with any level of coding experience. Teams of 2-4 members. Mentors available throughout the event.',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      venue: 'Innovation Lab, Block C',
      category: 'coding',
      tags: ['hackathon', 'coding', 'programming', 'developer', 'tech'],
      capacity: 150,
      prizes: '1st: ₹20,000 | 2nd: ₹15,000 | 3rd: ₹10,000',
      requirements: 'Laptop, enthusiasm, and a team!',
      createdBy: clubs[0]._id
    },
    {
      title: 'Web Development Workshop: React & Node.js',
      description: 'A comprehensive hands-on workshop on modern web development using React.js and Node.js. Learn to build full-stack applications from scratch. Beginner friendly. Bring your laptop.',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      time: '2:00 PM',
      venue: 'Computer Lab 201',
      category: 'coding',
      tags: ['react', 'node', 'web', 'javascript', 'workshop'],
      capacity: 40,
      createdBy: clubs[0]._id
    },
    {
      title: 'Resonance - Annual Music Concert',
      description: 'An evening of spectacular musical performances featuring classical, western, and fusion genres. Solo and band performances by talented students. Entry is free for all students.',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      time: '6:00 PM',
      venue: 'Open Air Amphitheater',
      category: 'music',
      tags: ['music', 'concert', 'performance', 'singing', 'band'],
      capacity: 500,
      createdBy: clubs[1]._id
    },
    {
      title: 'Dance Fever - Inter-College Dance Competition',
      description: 'Show off your dance moves at the biggest inter-college dance competition! Solo and group categories in classical, western, folk, and freestyle. Prize pool of ₹30,000.',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      time: '4:00 PM',
      venue: 'Main Auditorium',
      category: 'dance',
      tags: ['dance', 'competition', 'choreography', 'performance', 'freestyle'],
      capacity: 200,
      prizes: 'Solo: ₹10,000 | Group: ₹20,000',
      createdBy: clubs[1]._id
    },
    {
      title: 'Cricket Premier League - Campus Edition',
      description: 'The most awaited cricket tournament of the year! 16 department teams compete for the CampusConnect Cricket Trophy. Register your team now. Matches on weekends.',
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      time: '8:00 AM',
      venue: 'University Cricket Ground',
      category: 'sports',
      tags: ['cricket', 'tournament', 'sports', 'team', 'match'],
      capacity: 200,
      createdBy: clubs[2]._id
    },
    {
      title: 'Startup Pitch Competition - E-Summit 2024',
      description: 'Present your startup idea to a panel of investors and industry experts. Win seed funding up to ₹1 Lakh! Open to all students with a business idea. Pre-registration required.',
      date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      venue: 'Seminar Hall A',
      category: 'business',
      tags: ['startup', 'business', 'entrepreneurship', 'pitch', 'investment'],
      capacity: 80,
      prizes: 'Seed Funding up to ₹1,00,000',
      isPlacementRelated: false,
      createdBy: clubs[3]._id
    },
    {
      title: 'Google Campus Hiring Drive',
      description: 'Google is visiting our campus for a hiring drive for Software Engineer roles. Students in 3rd and 4th year from CSE, IT, ECE branches are eligible. Register to confirm your seat for the aptitude test.',
      date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      time: '9:00 AM',
      venue: 'Examination Hall 1 & 2',
      category: 'coding',
      tags: ['placement', 'google', 'hiring', 'software engineer', 'career'],
      capacity: 300,
      isPlacementRelated: true,
      companyName: 'Google',
      jobRole: 'Software Engineer',
      createdBy: clubs[0]._id
    },
    {
      title: 'Photography Walk - Campus Edition',
      description: 'Join us for a guided photography walk around the campus. Learn composition, lighting, and storytelling through your lens. Open to beginners and experts. Best 3 photos win prizes!',
      date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      time: '7:00 AM',
      venue: 'Main Gate (Assembly Point)',
      category: 'photography',
      tags: ['photography', 'photo', 'camera', 'creative', 'walk'],
      capacity: 30,
      createdBy: clubs[1]._id
    },
    {
      title: 'ML & AI Workshop: Build Your First Neural Network',
      description: 'Hands-on workshop on Machine Learning and Artificial Intelligence. We will build and train a neural network from scratch using Python. Basic Python knowledge required.',
      date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      time: '11:00 AM',
      venue: 'Computer Lab 305',
      category: 'science',
      tags: ['machine learning', 'ai', 'python', 'neural network', 'coding', 'data science'],
      capacity: 35,
      requirements: 'Laptop with Python 3.x installed',
      createdBy: clubs[0]._id
    },
    {
      title: 'Nukkad Natak - Street Play Festival',
      description: 'An open street play festival addressing social issues through the powerful medium of theater. Teams of 8-12 perform 15-minute plays on social themes. Awards for best play, direction, and acting.',
      date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      time: '3:00 PM',
      venue: 'Central Plaza',
      category: 'drama',
      tags: ['drama', 'theater', 'performance', 'skit', 'stage', 'acting'],
      capacity: 300,
      createdBy: clubs[1]._id
    }
  ]);
  console.log(`✅ Created ${events.length} events`);

  // Create some registrations
  await Registration.create([
    { user: students[0]._id, event: events[0]._id },
    { user: students[0]._id, event: events[1]._id },
    { user: students[0]._id, event: events[8]._id },
    { user: students[1]._id, event: events[2]._id },
    { user: students[1]._id, event: events[3]._id },
    { user: students[1]._id, event: events[7]._id },
    { user: students[2]._id, event: events[4]._id },
    { user: students[2]._id, event: events[0]._id },
    { user: students[3]._id, event: events[5]._id },
    { user: students[3]._id, event: events[9]._id },
  ]);
  console.log('✅ Created sample registrations');

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log('📧 Test Accounts:');
  console.log('─────────────────────────────────────────────');
  console.log('STUDENTS:');
  console.log('  arjun@student.edu   / password123  (CS, interests: coding/gaming)');
  console.log('  priya@student.edu   / password123  (Arts, interests: music/dance)');
  console.log('  rahul@student.edu   / password123  (Mech, interests: sports/coding)');
  console.log('  sneha@student.edu   / password123  (MBA, interests: debate/business)');
  console.log('CLUBS:');
  console.log('  codecraft@campus.edu / password123  (CodeCraft Club)');
  console.log('  rhythm@campus.edu    / password123  (Rhythm & Soul)');
  console.log('  sports@campus.edu    / password123  (Sports Committee)');
  console.log('  ecell@campus.edu     / password123  (E-Cell)');
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
