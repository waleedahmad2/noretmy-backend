const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  const { paymentMethodId, amount } = req.body;

  // Log the received request body for debugging
  console.log('Received Payment Intent Request:', req.body);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,  // Use the paymentMethodId received from the frontend
      payment_method_types: ['card'],    // Set accepted payment method types
      confirm: true,                     // Confirm the payment immediately
    });

    // Log successful payment intent creation
    console.log('Payment Intent Created:', paymentIntent);

    res.status(200).send({ success: true, paymentIntent });
  } catch (error) {
    // Log error details for debugging
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};
