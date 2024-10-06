const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure to add your Stripe secret key in your .env file

exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  try {
    // Create a PaymentIntent with the provided amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Stripe expects the amount in the smallest currency unit (e.g., cents for USD)
      currency: 'usd', // Use the currency of your choice
      payment_method_types: ['card'], // You can add other payment methods here if needed
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret, // This will be sent to the frontend
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};
