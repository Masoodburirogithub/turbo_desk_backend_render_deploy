const express = require('express');
const { submitContact, getAllContacts, updateContactStatus } = require('../controllers/contactController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/submit', submitContact);
router.get('/submissions', authenticate, authorizeAdmin, getAllContacts);
router.put('/submissions/:id/status', authenticate, authorizeAdmin, updateContactStatus);

module.exports = router;