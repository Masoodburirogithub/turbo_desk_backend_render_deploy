// backend/src/routes/adminRoutes.js
const express = require('express');
const { 
  getDashboardStats, 
  getApplications, 
  updateApplicationStatus,
  getContacts,
  updateContactStatus
} = require('../controllers/adminController');
const { 
  createCaseStudy, 
  updateCaseStudy, 
  deleteCaseStudy 
} = require('../controllers/caseStudyController');
const { 
  createPosition, 
  updatePosition, 
  deletePosition 
} = require('../controllers/careersController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// Import visitor tracking functions
const { 
  trackPageViewDuration, 
  trackEvent, 
  getSession 
} = require('../middleware/visitorTracking');

// Import visitor controllers
const {
  getAllVisitors,
  getVisitorById,
  getVisitorStats,
  getPageViewsAnalytics,
  exportVisitorsCSV
} = require('../controllers/visitorController');

const router = express.Router();

// Dashboard
router.get('/dashboard/stats', authenticate, authorizeAdmin, getDashboardStats);

// Applications
router.get('/applications', authenticate, authorizeAdmin, getApplications);
router.put('/applications/:id/status', authenticate, authorizeAdmin, updateApplicationStatus);

// Contacts
router.get('/contacts', authenticate, authorizeAdmin, getContacts);
router.put('/contacts/:id/status', authenticate, authorizeAdmin, updateContactStatus);

// Case Studies CRUD
router.post('/case-studies', authenticate, authorizeAdmin, createCaseStudy);
router.put('/case-studies/:id', authenticate, authorizeAdmin, updateCaseStudy);
router.delete('/case-studies/:id', authenticate, authorizeAdmin, deleteCaseStudy);

// Career Positions CRUD
router.post('/positions', authenticate, authorizeAdmin, createPosition);
router.put('/positions/:id', authenticate, authorizeAdmin, updatePosition);
router.delete('/positions/:id', authenticate, authorizeAdmin, deletePosition);

// ==================== VISITOR TRACKING ROUTES ====================
// Public routes (no authentication required for tracking)
router.get('/visitor/session', getSession);
router.post('/visitor/track-duration', trackPageViewDuration);
router.post('/visitor/track-event', trackEvent);

// Admin routes (require authentication)
router.get('/visitors', authenticate, authorizeAdmin, getAllVisitors);
router.get('/visitors/stats', authenticate, authorizeAdmin, getVisitorStats);
router.get('/visitors/:id', authenticate, authorizeAdmin, getVisitorById);
router.get('/visitors/analytics/page-views', authenticate, authorizeAdmin, getPageViewsAnalytics);
router.get('/visitors/export/csv', authenticate, authorizeAdmin, exportVisitorsCSV);

module.exports = router;