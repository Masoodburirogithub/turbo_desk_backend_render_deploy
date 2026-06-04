// backend/src/routes/ragRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  saveUserInfo,
  uploadDocument, 
  getDocuments, 
  deleteDocument, 
  reindexDocument, 
  askQuestion, 
  getConversations,
  getAllUsers,
  getPendingRequests,
  acceptRequest,
  getUserConversations
} = require('../controllers/ragController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads/rag');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.txt');
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public routes
router.post('/save-user', saveUserInfo);
router.post('/ask', askQuestion);
router.get('/conversations/:sessionId', getConversations);

// Admin routes
router.post('/documents', authenticate, authorizeAdmin, upload.single('file'), uploadDocument);
router.get('/documents', authenticate, authorizeAdmin, getDocuments);
router.delete('/documents/:id', authenticate, authorizeAdmin, deleteDocument);
router.post('/documents/:id/reindex', authenticate, authorizeAdmin, reindexDocument);
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.get('/users/:userId/conversation', authenticate, authorizeAdmin, getUserConversations);
router.get('/conversations/user/:userId', authenticate, authorizeAdmin, getUserConversations);

router.get('/pending-requests', authenticate, authorizeAdmin, getPendingRequests);
router.post('/accept-request/:requestId', authenticate, authorizeAdmin, acceptRequest);

module.exports = router;