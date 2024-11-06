

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
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










// Process a Withdrawal Request
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



// //  Paypal Co trollers


// paypal.configure({
//   mode: 'sandbox', // Use 'sandbox' for testing, 'live' for production
//   client_id: process.env.PAYPAL_CLIENT_ID,
//   client_secret: process.env.PAYPAL_CLIENT_SECRET,
// });


// // Controller to create a PayPal payment (checkout)
// exports.createPayment = (req, res) => {
//   const paymentJson = {
//     intent: 'sale',
//     payer: {
//       payment_method: 'paypal',
//     },
//     redirect_urls: {
//       return_url: 'http://localhost:3000/api/paypal/success',
//       cancel_url: 'http://localhost:3000/api/paypal/cancel',
//     },
//     transactions: [
//       {
//         item_list: {
//           items: [
//             {
//               name: 'Sample Item',
//               sku: '001',
//               price: '10.00',
//               currency: 'USD',
//               quantity: 1,
//             },
//           ],
//         },
//         amount: {
//           currency: 'USD',
//           total: '10.00',
//         },
//         description: 'This is the payment description.',
//       },
//     ],
//   };

//   paypal.payment.create(paymentJson, (error, payment) => {
//     if (error) {
//       console.error('Error creating payment:', error);
//       res.status(500).json({ error: 'Error creating PayPal payment' });
//     } else {
//       const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
//       res.redirect(approvalUrl);
//     }
//   });
// };

// // Controller to execute a PayPal payment
// exports.executePayment = (req, res) => {
//   const payerId = req.query.PayerID;
//   const paymentId = req.query.paymentId;

//   const executePaymentJson = {
//     payer_id: payerId,
//     transactions: [
//       {
//         amount: {
//           currency: 'USD',
//           total: '10.00',
//         },
//       },
//     ],
//   };

//   paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
//     if (error) {
//       console.error('Error executing payment:', error);
//       res.status(500).json({ error: 'Payment failed' });
//     } else {
//       res.send('Payment successful');
//     }
//   });
// };

// // Controller to handle payment cancellation
// exports.cancelPayment = (req, res) => {
//   res.send('Payment cancelled');
// };

// // Controller to create a PayPal payout (withdrawal)
// exports.createPayout = (req, res) => {
//   const { receiverEmail, amount } = req.body;

//   const payoutJson = {
//     sender_batch_header: {
//       sender_batch_id: Math.random().toString(36).substring(9),
//       email_subject: 'You have a payout!',
//       email_message: 'You have received a payout! Thanks for using our service!',
//     },
//     items: [
//       {
//         recipient_type: 'EMAIL',
//         amount: {
//           value: amount,
//           currency: 'USD',
//         },
//         receiver: receiverEmail,
//         note: 'Thank you for using our service',
//         sender_item_id: 'item-1',
//       },
//     ],
//   };

//   paypal.payout.create(payoutJson, function (error, payout) {
//     if (error) {
//       console.error('Error creating payout:', error.response);
//       res.status(500).json({ error: 'Error creating PayPal payout' });
//     } else {
//       console.log('Payout created successfully:', payout);
//       res.json({
//         message: 'Payout created successfully',
//         payoutId: payout.batch_header.payout_batch_id,
//       });
//     }
//   });
// };
