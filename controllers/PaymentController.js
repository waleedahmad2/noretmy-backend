const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  const { paymentMethodId, amount } = req.body;

  try {

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'usd',
      payment_method: paymentMethodId,  
      payment_method_types: ['card'],   
      confirm: true,
    });

    res.status(200).send({ success: true, paymentIntent });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
