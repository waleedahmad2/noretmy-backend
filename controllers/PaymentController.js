

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

const Freelancer = require('../models/Freelancer');
const Order = require('../models/Order'); 
const User = require('../models/User');

const bodyParser = require('body-parser');
const { sendUserNotificationEmail } = require('../services/emailService');



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
    const feePercentage = 0.01; 

    // Calculate the total amount in dollars first
    const totalAmountInDollars = amount + (amount * feePercentage) ;

    // Convert total amount to cents (Stripe expects amount in cents)
    const totalAmountInCents = Math.round(totalAmountInDollars * 100);

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
      amount: totalAmountInCents,  // Amount is in cents
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
    });

    return { 
      payment_intent: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating customer and payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};



// exports.withdrawFunds = async (req, res) => {
//     const { email, amount } = req.body; // Freelancer's email and withdrawal amount

//     try {
//         // Check if the freelancer account exists
//         let freelancerAccount = await Freelancer.findOne({ email });

//         // If the account doesn't exist, create it
//         if (!freelancerAccount) {
//             const account = await stripe.accounts.create({
//                 type: 'standard', // You can choose 'standard' or 'express'
//                 country: 'US', // Set the country for the connected account
//                 email: email, // Freelancer's email
//                 capabilities: {
//                     card_payments: { requested: true },
//                     transfers: { requested: true },
//                 },
//             });

//             // Create a new Freelancer record in the database
//             freelancerAccount = new Freelancer({
//                 email,
//                 stripeAccountId: account.id,
//                 availableBalance: 30, //
//             });

//             await freelancerAccount.save();
//         }

//         // Check if the available balance is sufficient
//         if (freelancerAccount.availableBalance < amount) {
//             return res.status(400).json({ error: 'Insufficient funds' });
//         }

//         // Create a payout to the freelancer's connected account
//         const payout = await stripe.payouts.create(
//             {
//                 amount: amount, 
//                 currency: 'usd', 
//             },
//             {
//                 stripeAccount: freelancerAccount.stripeAccountId, 
//             }
//         );

//         freelancerAccount.availableBalance -= amount;
//         await freelancerAccount.save();

//         res.status(200).json({ success: true, payout });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };



exports.paypalWithdrawFunds = async (req, res) => {
    const { email, amount } = req.body; // Freelancer's email and withdrawal amount

    try {
        // Get PayPal access token
        const tokenResponse = await axios.post(
            'https://api-m.sandbox.paypal.com/v1/oauth2/token', // Use the live URL for production: 'https://api-m.paypal.com/v1/oauth2/token'
            'grant_type=client_credentials',
            {
                auth: {
                    username: process.env.PAYPAL_CLIENT_ID,
                    password: process.env.PAYPAL_CLIENT_SECRET,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Check if the freelancer exists in your database
        const freelancer = await Freelancer.findOne({ email });
        if (!freelancer) {
            return res.status(404).json({ error: 'Freelancer account not found' });
        }

        // Check if the freelancer has sufficient balance
        if (freelancer.availableBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create a PayPal payout
        const payoutResponse = await axios.post(
            'https://api-m.sandbox.paypal.com/v1/payments/payouts', // Use the live URL for production: 'https://api-m.paypal.com/v1/payments/payouts'
            {
                sender_batch_header: {
                    email_subject: 'You have a payout!',
                    email_message: 'You have received a payout via PayPal.',
                },
                items: [
                    {
                        recipient_type: 'EMAIL',
                        amount: {
                            value: amount.toFixed(2), // Amount in USD
                            currency: 'USD',
                        },
                        receiver: email, // PayPal email of the recipient
                        note: 'Payout from platform',
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Deduct the amount from the freelancer's balance
        freelancer.availableBalance -= amount;
        await freelancer.save();

        res.status(200).json({
            success: true,
            message: 'Payout successfully processed via PayPal',
            payout: payoutResponse.data,
        });
    } catch (error) {
        console.error('PayPal Payout Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
        });
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
                type: 'express', // Type of account (can be 'express' or 'custom' based on your needs)
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
                availableBalance: 30, // You can update the balance as per your requirements
            });

            await freelancerAccount.save();

            // Create the onboarding link if the freelancer has not completed onboarding
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://your-platform.com/onboarding-refresh', // Redirect if freelancer needs to update information
                return_url: 'https://your-platform.com/onboarding-success', // Redirect after successful onboarding
                type: 'account_onboarding', // Type of onboarding flow
            });

            // Send the onboarding link to the freelancer
            return res.status(200).json({ 
                success: true,
                message: 'Freelancer account created. Complete your onboarding.',
                link: accountLink.url // Redirect the freelancer to this URL to complete onboarding
            });
        }

        // If the freelancer already exists, check if they have completed onboarding
        const account = await stripe.accounts.retrieve(freelancerAccount.stripeAccountId);

        if (account.charges_enabled === false) {
            // If the freelancer has not completed onboarding, ask them to do so
            const accountLink = await stripe.accountLinks.create({
                account: freelancerAccount.stripeAccountId,
                refresh_url: 'https://noretmy.com/onboarding-refresh', // Redirect if freelancer needs to update information
                return_url: 'https://noretmy.com/onboarding-success', // Redirect after successful onboarding
                type: 'account_onboarding',
            })

            return res.status(400).json({
                success: false,
                message: 'Please complete the onboarding process before withdrawing funds.',
                link: accountLink.url // Send the onboarding link
            });
        }

        // Check if the available balance is sufficient
        if (freelancerAccount.availableBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create a payout to the freelancer's connected account
        const payout = await stripe.payouts.create(
            {
                amount: amount * 100, // Amount is in cents
                currency: 'usd',
            },
            {
                stripeAccount: freelancerAccount.stripeAccountId, // Freelancer's Stripe account ID
            }
        );

        // Update freelancer's balance after payout
        freelancerAccount.availableBalance -= amount;
        await freelancerAccount.save();

        res.status(200).json({ success: true, payout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.withdrawFundsthroughPayPal = async (req, res) => {
  const { email, amount } = req.body; 

  try {
      // Validate freelancer account
      const freelancer = await Freelancer.findOne({ email });
      if (!freelancer) {
          return res.status(404).json({ error: 'Freelancer account not found.' });
      }

      // Validate available balance
      if (freelancer.availableBalance < amount) {
          return res.status(400).json({ error: 'Insufficient balance.' });
      }

      // Prepare the payout request
      const requestBody = {
          sender_batch_header: {
              email_subject: "You have a payment from Noremt!",
              email_message: "You have received your earnings. Thank you for working with Noremt!",
          },
          items: [
              {
                  recipient_type: "EMAIL",
                  receiver: email, // Freelancer's PayPal email
                  amount: {
                      value: amount.toFixed(2), // Amount in USD
                      currency: "USD",
                  },
                  note: "Withdrawal from Noremt platform",
              },
          ],
      };

      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody(requestBody);

      // Execute the payout
      const response = await client.execute(request);

      // Update freelancer's balance
      freelancer.availableBalance -= amount;
      await freelancer.save();

      // Respond to the client
      res.status(200).json({
          success: true,
          message: 'Withdrawal successful.',
          payoutBatchId: response.result.batch_header.payout_batch_id,
      });
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
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

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
      User.findById(updatedOrder.sellerId, 'email'),
      User.findById(updatedOrder.buyerId, 'email'),
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
      sendUserNotificationEmail(sellerEmail, 'invoice', sellerMessage, 'seller', updatedOrder),
      sendUserNotificationEmail(buyerEmail, 'invoice', buyerMessage, 'buyer', updatedOrder),
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

