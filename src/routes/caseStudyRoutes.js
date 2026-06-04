// backend/src/routes/caseStudyRoutes.js
const express = require('express');
const {
  getCaseStudies,
  getCaseStudyById,
  getCaseStudyBySlug,  // Import the new function
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy
} = require('../controllers/caseStudyController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes - IMPORTANT: Order matters!
router.get('/', getCaseStudies);
router.get('/by-id/:id', getCaseStudyById);  // Specific route for ID lookup
router.get('/:slug', getCaseStudyBySlug);     // Dynamic slug route (catch-all)

// Admin routes
router.post('/', authenticate, authorizeAdmin, createCaseStudy);
router.put('/:id', authenticate, authorizeAdmin, updateCaseStudy);
router.delete('/:id', authenticate, authorizeAdmin, deleteCaseStudy);

module.exports = router;