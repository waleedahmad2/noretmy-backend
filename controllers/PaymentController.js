const Stripe = require('stripe');

// Initialize Stripe with the secret key from the environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Controller to handle payment intent creation
exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  try {
    // Create a PaymentIntent with the amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
    });

    // Send the client secret to the frontend
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
