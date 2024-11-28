

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Freelancer = require('../models/Freelancer');


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
