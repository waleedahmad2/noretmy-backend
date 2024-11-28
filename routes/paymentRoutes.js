const express = require('express');
const { createCustomerAndPaymentIntent,withdrawFunds,processRefund, handleStripeWebhook } = require('../controllers/PaymentController');
const bodyParser = require('body-parser');


const router = express.Router();

// Define the route for creating a payment intent
router.post('/create-payment-intent', createCustomerAndPaymentIntent);

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/withdraw', withdrawFunds);

// Route for processing refunds
router.post('/refund', processRefund);





module.exports = router;
