// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure to add your Stripe secret key in your .env file

// exports.createPaymentIntent = async (req, res) => {
//   const { amount } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount, // Stripe expects the amount in the smallest currency unit (e.g., cents for USD)
//       currency: 'usd', // Use the currency of your choice
//       payment_method_types: ['card'], // You can add other payment methods here if needed
//     });

//     res.status(200).json({
//       client_secret: paymentIntent.client_secret, // This will be sent to the frontend
//     });
//   } catch (error) {
//     console.error('Error creating payment intent:', error);
//     res.status(500).json({ error: 'Failed to create payment intent' });
//   }
// };


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
