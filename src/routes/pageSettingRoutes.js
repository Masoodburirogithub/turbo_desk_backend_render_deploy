// backend/src/routes/pageSettingRoutes.js
const express = require('express');
const { getPageSettings, updatePageSettings } = require('../controllers/pageSettingController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.get('/:page/:section', getPageSettings);

// Admin routes
router.put('/:page/:section', authenticate, authorizeAdmin, updatePageSettings);

module.exports = router;