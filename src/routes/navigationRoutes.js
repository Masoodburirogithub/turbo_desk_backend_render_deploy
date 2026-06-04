// backend/src/routes/navigationRoutes.js
const express = require('express');
const { 
  getNavigationMenus, 
  createNavigationMenu, 
  updateNavigationMenu, 
  deleteNavigationMenu 
} = require('../controllers/navigationController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public route - anyone can view navigation
router.get('/', getNavigationMenus);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, createNavigationMenu);
router.put('/:id', authenticate, authorizeAdmin, updateNavigationMenu);
router.delete('/:id', authenticate, authorizeAdmin, deleteNavigationMenu);

module.exports = router;