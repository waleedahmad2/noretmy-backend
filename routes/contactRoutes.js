const express = require('express');
const { submitContactForm,getAllMessages, replyMessage } = require('../controllers/contactController');
const { verifyToken } = require('../middleware/jwt');
const router = express.Router();

// Contact form submission route
router.post('/', submitContactForm);
router.get('/', getAllMessages);
router.post('/reply', replyMessage);



module.exports = router;
