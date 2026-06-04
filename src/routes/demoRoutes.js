// backend/src/routes/demoRoutes.js
const express = require('express');
const { 
  submitDemoRequest,
  getAllDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest
} = require('../controllers/demoController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route
router.post('/submit', submitDemoRequest);

// Admin routes
router.get('/requests', authenticate, authorizeAdmin, getAllDemoRequests);
router.put('/requests/:id/status', authenticate, authorizeAdmin, updateDemoRequestStatus);
router.delete('/requests/:id', authenticate, authorizeAdmin, deleteDemoRequest);

module.exports = router;