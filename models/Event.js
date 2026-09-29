/**
 * Event Model
 * College events created by clubs
 */
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['coding', 'music', 'dance', 'sports', 'art', 'literature', 'science', 'business', 'gaming', 'photography', 'drama', 'debate', 'workshop', 'seminar', 'other'],
    default: 'other'
  },
  // AI-generated tags from description
  tags: [{
    type: String,
    trim: true
  }],
  poster: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 100,
    min: 1
  },
  registrationDeadline: {
    type: Date
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  fee: {
    type: Number,
    default: 0
  },
  prizes: {
    type: String,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  // Reference to creating club/user
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Placement/company related
  isPlacementRelated: {
    type: Boolean,
    default: false
  },
  companyName: {
    type: String,
    trim: true
  },
  jobRole: {
    type: String,
    trim: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for registration count (populated separately)
EventSchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Index for search
EventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Check if event is past
EventSchema.virtual('isPast').get(function() {
  return new Date() > this.date;
});

// Check if registration is open--------------Virtual() mongodb ki ek property 
//jp ki db m store ni hoti but dynamically caluculate hoti hai jb koi access krta hai 
// jaise ki const event=Event.findById krega agr event hua thenn
//event.isregistrationopen acess kar payega 

EventSchema.virtual('isRegistrationOpen').get(function() {
  if (this.registrationDeadline) {
    return new Date() < this.registrationDeadline && new Date() < this.date;
  }
  return new Date() < this.date;
});

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', EventSchema);
