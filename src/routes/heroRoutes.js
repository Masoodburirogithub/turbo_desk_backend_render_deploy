// backend/src/routes/heroRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getHeroSettings, updateHeroSettings, uploadVideo } = require('../controllers/heroController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for temporary video upload
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Public route
router.get('/', getHeroSettings);

// Admin routes
router.put('/', authenticate, authorizeAdmin, updateHeroSettings);
router.post('/upload-video', authenticate, authorizeAdmin, upload.single('video'), uploadVideo);

module.exports = router;