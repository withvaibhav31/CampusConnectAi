/**
 * Event Routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getAllEvents, getEventDetail, getCreateEvent,
  postCreateEvent, getEditEvent, updateEvent, deleteEvent
} = require('../controllers/eventController');
const { verifyToken, requireClub } = require('../middleware/auth');

// Multer config for poster uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `event-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

router.get('/', getAllEvents);
router.get('/create', verifyToken, requireClub, getCreateEvent);
router.post('/create', verifyToken, requireClub, upload.single('poster'), postCreateEvent);
router.get('/:id', getEventDetail);
router.get('/:id/edit', verifyToken, requireClub, getEditEvent);
router.put('/:id', verifyToken, requireClub, updateEvent);
router.delete('/:id', verifyToken, requireClub, deleteEvent);

module.exports = router;
