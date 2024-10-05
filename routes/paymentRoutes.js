const express = require('express');
const { createPaymentIntent } = require('../controllers/paymentController');

const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
