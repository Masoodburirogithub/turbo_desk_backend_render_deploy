// backend/src/routes/dynamicServiceRoutes.js
const express = require('express');
const {
  getDynamicServices,
  createDynamicService,
  updateDynamicService,
  deleteDynamicService
} = require('../controllers/dynamicServiceController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public route
router.get('/', getDynamicServices);

// Admin routes
router.post('/', authenticate, authorizeAdmin, createDynamicService);
router.put('/:id', authenticate, authorizeAdmin, updateDynamicService);
router.delete('/:id', authenticate, authorizeAdmin, deleteDynamicService);

module.exports = router;