const express = require('express');
const { createCustomerAndPaymentIntent,withdrawFunds,processRefund,createPayment,executePayment,cancelPayment,createPayout } = require('../controllers/PaymentController');

const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createCustomerAndPaymentIntent);

router.post('/withdraw', withdrawFunds);

// Route for processing refunds
router.post('/refund', processRefund);


// Paypal Routes

// Route to create a payment (checkout)
router.get('/pay', createPayment);

// Route to handle successful payment
router.get('/success', executePayment);

// Route to handle payment cancellation
router.get('/cancel', cancelPayment);

// Route to create a payout (withdrawal)
router.post('/payout', createPayout);


module.exports = router;
