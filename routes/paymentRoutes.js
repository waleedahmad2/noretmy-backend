const express = require('express');
const { createCustomerAndPaymentIntent,withdrawFunds,processRefund } = require('../controllers/PaymentController');

const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createCustomerAndPaymentIntent);

router.post('/withdraw', withdrawFunds);

// Route for processing refunds
router.post('/refund', processRefund);





module.exports = router;
