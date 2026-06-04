// backend/src/routes/serviceRoutes.js
const express = require('express');
const {
  getServices,
  getServiceById,
  getServiceBySlug,  // Import new function
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes - IMPORTANT: Order matters!
router.get('/', getServices);
router.get('/by-id/:id', getServiceById);  // Specific route for ID lookup
router.get('/:slug', getServiceBySlug);     // Dynamic slug route

// Admin routes
router.post('/', authenticate, authorizeAdmin, createService);
router.put('/:id', authenticate, authorizeAdmin, updateService);
router.delete('/:id', authenticate, authorizeAdmin, deleteService);

module.exports = router;