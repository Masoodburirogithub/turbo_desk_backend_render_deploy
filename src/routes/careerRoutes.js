// backend/src/routes/careerRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getPositions, 
  applyForPosition, 
  createPosition, 
  updatePosition, 
  deletePosition,
  getAllApplications,
  updateApplicationStatus,
  downloadCV
} = require('../controllers/careersController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for CV uploads
const cvUploadDir = path.join(__dirname, '../../uploads/cvs');
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvUploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const safeName = req.body.fullName?.replace(/\s/g, '_') || 'applicant';
    cb(null, `${safeName}_${timestamp}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public routes
router.get('/positions', getPositions);
router.post('/apply', upload.single('cv'), applyForPosition);

// Admin routes
router.get('/applications', authenticate, authorizeAdmin, getAllApplications);
router.put('/applications/:id/status', authenticate, authorizeAdmin, updateApplicationStatus);
router.get('/applications/:id/download-cv', authenticate, authorizeAdmin, downloadCV);
router.post('/positions', authenticate, authorizeAdmin, createPosition);
router.put('/positions/:id', authenticate, authorizeAdmin, updatePosition);
router.delete('/positions/:id', authenticate, authorizeAdmin, deletePosition);

module.exports = router;