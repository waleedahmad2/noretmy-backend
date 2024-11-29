

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Freelancer = require('../models/Freelancer');
const Order = require('../models/Order'); 
const User = require('../models/User');

const bodyParser = require('body-parser');
const { default: sendUserNotificationEmail } = require('../services/emailService');




exports.createCustomerAndPaymentIntent = async (req, res) => {
  const { amount, email } = req.body;

  // Validate the inputs
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    // Check if the customer already exists (optional step)
    let customer = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customer.data.length > 0) {
      // If customer exists, use the existing customer
      customer = customer.data[0];
    } else {
      // Otherwise, create a new customer
      customer = await stripe.customers.create({
        email,
      });
    }

    // Create a Payment Intent linked to the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating customer and payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};



exports.createCustomerAndPaymentIntentUtil = async (amount, email) => {
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email');
  }

  try {
    // Check if the customer already exists (optional step)
    let customer = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customer.data.length > 0) {
      // If customer exists, use the existing customer
      customer = customer.data[0];
    } else {
      // Otherwise, create a new customer
      customer = await stripe.customers.create({
        email,
      });
    }

    // Create a Payment Intent linked to the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
    });

    return {  payment_intent: paymentIntent.id,  
      client_secret: paymentIntent.client_secret, };
  } catch (error) {
    console.error('Error creating customer and payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};


exports.withdrawFunds = async (req, res) => {
    const { email, amount } = req.body; // Freelancer's email and withdrawal amount

    try {
        // Check if the freelancer account exists
        let freelancerAccount = await Freelancer.findOne({ email });

        // If the account doesn't exist, create it
        if (!freelancerAccount) {
            const account = await stripe.accounts.create({
                type: 'standard', // You can choose 'standard' or 'express'
                country: 'US', // Set the country for the connected account
                email: email, // Freelancer's email
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Create a new Freelancer record in the database
            freelancerAccount = new Freelancer({
                email,
                stripeAccountId: account.id,
                availableBalance: 30, //
            });

            await freelancerAccount.save();
        }

        // Check if the available balance is sufficient
        if (freelancerAccount.availableBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create a payout to the freelancer's connected account
        const payout = await stripe.payouts.create(
            {
                amount: amount, 
                currency: 'usd', 
            },
            {
                stripeAccount: freelancerAccount.stripeAccountId, 
            }
        );

        freelancerAccount.availableBalance -= amount;
        await freelancerAccount.save();

        res.status(200).json({ success: true, payout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.processRefund = async (req, res) => {
    const { chargeId, amount } = req.body; // Charge ID and refund amount

    try {
        // Create a refund
        const refund = await stripe.refunds.create({
            charge: chargeId,
            amount: amount, // Amount in cents (optional, refund full amount if omitted)
        });

        res.status(200).json({ success: true, refund });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};




// Handle Stripe Webhook events
 exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']; // Get the Stripe signature from the request headers
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Get the webhook secret from your environment variables
  let event;

  try {
    // Pass raw body (Buffer) to stripe.webhooks.constructEvent for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Respond to Stripe to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err) {
    // If we can't verify the event signature, respond with an error
    console.error('Webhook Error: ', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Function to handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const { id, amount_received, payment_method } = paymentIntent;

  try {
    // Update the order with payment details
    const updatedOrder = await Order.findOneAndUpdate(
      { payment_intent: id },
      {
        isCompleted: true,
        status: 'created',
        paymentMethod: payment_method,
        amountReceived: amount_received / 100, // Stripe amounts are in cents
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.error('Order not found for PaymentIntent ID:', id);
      return;
    }

    console.log('Order successfully updated:', updatedOrder);

    // Fetch seller and buyer emails
    const [seller, buyer] = await Promise.all([
      User.findById({_id:updatedOrder.sellerId}, 'email'),
      User.findById({_id:updatedOrder.buyerId}, 'email'),
    ]);

    if (!seller || !buyer) {
      throw new Error('Seller or buyer not found.');
    }

    const sellerEmail = seller.email;
    const buyerEmail = buyer.email;

    // Prepare messages
    const sellerMessage = `
      <p>Dear Seller,</p>
      <p>Congratulations! You have received a new order.</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Order ID: ${updatedOrder._id}</li>
        <li>Gig ID: ${updatedOrder.gigId}</li>
        <li>Price: $${updatedOrder.price}</li>
        <li>Payment Method: ${updatedOrder.paymentMethod}</li>
      </ul>
      <p>Please review the order requirements and start working.</p>
      <p>Best regards,<br>The Noretmy Team</p>
    `;

    const buyerMessage = `
      <p>Dear Buyer,</p>
      <p>Thank you for your purchase! Your order has been successfully placed.</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Order ID: ${updatedOrder._id}</li>
        <li>Gig ID: ${updatedOrder.gigId}</li>
        <li>Price: $${updatedOrder.price}</li>
        <li>Payment Method: ${updatedOrder.paymentMethod}</li>
      </ul>
      <p>You can view the order details and communicate with the seller through your dashboard.</p>
      <p>Best regards,<br>The Noretmy Team</p>
    `;

    // Send notifications
    await Promise.all([
      sendUserNotificationEmail(sellerEmail, 'invoice', sellerMessage),
      sendUserNotificationEmail(buyerEmail, 'invoice', buyerMessage),
    ]);

    console.log('Notifications sent to both seller and buyer.');
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error.message);
  }
};


async function handlePaymentIntentFailed(paymentIntent) {
  const { id, last_payment_error } = paymentIntent;

  try {
    // Log the failed payment and update the order accordingly
    console.log('Payment failed for PaymentIntent ID:', id, 'Error:', last_payment_error);

    // Optionally, update the order's status to indicate a failed payment
    const updatedOrder = await Order.findOneAndUpdate(
      { payment_intent: id },
      { 
        isCompleted: false, 
        error: last_payment_error.message 
      },
      { new: true }
    );

    if (updatedOrder) {
      console.log('Order updated to reflect payment failure:', updatedOrder);
    }
  } catch (err) {
    console.error('Error handling failed payment intent:', err);
  }
}

