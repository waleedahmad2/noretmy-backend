const express = require('express');
const router = express.Router();
const { getSellerStats } = require('../controllers/sellerController'); // Import the controller

// Route to get seller statistics by sellerId
router.get('/stats/:sellerId', getSellerStats); // :sellerId is a dynamic parameter

module.exports = router;
