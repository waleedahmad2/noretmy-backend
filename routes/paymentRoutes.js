const express = require('express');
const { createCustomerAndPaymentIntent,withdrawFunds,processRefund } = require('../controllers/PaymentController');

const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createCustomerAndPaymentIntent);

router.post('/withdraw', withdrawFunds);

// Route for processing refunds
router.post('/refund', processRefund);


// Paypal Routes

// Route to create a payment (checkout)
router.get('/pay', paypalController.createPayment);

// Route to handle successful payment
router.get('/success', paypalController.executePayment);

// Route to handle payment cancellation
router.get('/cancel', paypalController.cancelPayment);

// Route to create a payout (withdrawal)
router.post('/payout', paypalController.createPayout);


module.exports = router;
