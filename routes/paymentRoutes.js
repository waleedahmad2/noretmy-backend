const express = require('express');
const { createCustomerAndPaymentIntent } = require('../controllers/PaymentController');

const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createCustomerAndPaymentIntent);

module.exports = router;
