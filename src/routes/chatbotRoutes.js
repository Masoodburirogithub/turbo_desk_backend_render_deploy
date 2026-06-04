// // backend/src/routes/chatbotRoutes.js
// const express = require('express');
// const { 
//   sendMessage, 
//   getHistory, 
//   clearHistory,
//   getAllConversations
// } = require('../controllers/chatbotController');
// const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
// const router = express.Router();

// // Public routes
// router.post('/message', sendMessage);
// router.get('/history/:sessionId', getHistory);
// router.delete('/history/:sessionId', clearHistory);

// // Admin routes
// router.get('/admin/conversations', authenticate, authorizeAdmin, getAllConversations);

// module.exports = router;