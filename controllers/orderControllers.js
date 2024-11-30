const Job = require("../models/Job");
const Order = require("../models/Order"); 
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');


const { createCustomerAndPaymentIntentUtil } = require("./PaymentController");

const dayjs=require("dayjs");


// Controller to create a new order
const createOrder = async (req, res) => {
  try {
    // Extract data from the request body
    const { userId } = req;
    const { gigId, price, status, email } = req.body;

    // Find the gig in the database
    const gig = await Job.findById(gigId);

    const orderPrice = price/100;
    const feeAndTax = (orderPrice * 0.02) +0.35;

    // Validate required fields
    if (!gigId || !price || !userId || !status || !email) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Create a new order in the database
    const newOrder = new Order({
      gigId: gigId,
      price: orderPrice,
      feeAndTax :feeAndTax,
      sellerId: gig.sellerId, // Use the sellerId from the gig
      buyerId: userId, // Use the buyerId from the request
      status: status, // Initial order status
      payment_intent: "Temp", // Temporary placeholder for payment intent
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    // Create a payment intent using the helper utility
    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(price, email);

    // Extract the client_secret from the payment intent response
    const { client_secret, payment_intent } = paymentIntentResponse;

    // Update the saved order with the actual payment intent ID
    savedOrder.payment_intent = payment_intent;
    await savedOrder.save();

    // Send the response to the frontend
    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
      client_secret: client_secret, // This is used on the frontend to confirm payment
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};



const getOrders= async (req,res) =>{
    try {
        const orders = await Order.find(); // Fetch all orders from the database
    
        if (!orders) {
          return res.status(404).json({ message: "No orders found" });
        }
    
        res.status(200).json(orders); // Respond with the user data
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }


}

const getUserOrders = async (req, res) => {
    try {
      const { userId } = req;
      
      // Fetch orders where either sellerId or buyerId matches the provided ID
      //show completed orders only
      const orders = await Order.find({
        $or: [{ sellerId:userId }, { buyerId: userId }]
      });
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }
  
      res.status(200).json(orders); // Respond with the orders data
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  

  const updateOrderPaymentStatus = async (req, res) => {
    try {
      const { orderId, paymentIntentId } = req.body;
  
      // Assuming you've already verified the payment success with the payment gateway
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, payment_intent: paymentIntentId },
        { isCompleted: true },
        { new: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found or paymentIntent mismatch" });
      }
  
      res.status(200).json({ message: "Payment successful, order updated", order: updatedOrder });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  



  
  const getSingleOrderDetail = async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.user; // Assuming userId is available in req.user (e.g., from JWT or session)
  
    try {
      // Find the order by orderId
      const order = await Order.findOne({ orderId }).exec();
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // Find the gigTitle from the Job model using gigId from the order
      const job = await Job.findOne({ _id: order.gigId }).exec();
      const gigTitle = job ? job.title : null;
  
      let userDetails = null; // Initialize to null
      let otherPartyDetails = null;
  
      // Check if the user is the buyer or seller
      if (userId === order.buyerId) {
        // User is the buyer, fetch the seller's details
        userDetails = await User.findById(order.sellerId).exec();
        otherPartyDetails = await UserProfile.findOne({ userId: order.sellerId }).exec();
      } else if (userId === order.sellerId) {
        // User is the seller, fetch the buyer's details
        userDetails = await User.findById(order.buyerId).exec();
        otherPartyDetails = await UserProfile.findOne({ userId: order.buyerId }).exec();
      }
  
      // Prepare the order details
      const orderDetails = {
        orderId: order.orderId,
        gigTitle: gigTitle || 'Gig title unavailable', // Fallback if gigTitle is null
        orderStatus: order.status,
        orderPrice: order.price,
        requirements: order.orderRequirements,
        attachments: order.attachments,
      };
  
      // Prepare user details if available
      const userDetailsResponse = userDetails
        ? {
            userName: userDetails.fullName,
            userUsername: userDetails.username,
            userImage: otherPartyDetails ? otherPartyDetails.profilePicture : 'default-image.jpg',
          }
        : null;
  
      // Build the response object
      const response = {
        ...(userDetailsResponse && { userDetails: userDetailsResponse }), // Include only if userDetails exists
        orderDetails,
      };
  
      // Return the response
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
 
  const getPaymentsSummary = async (req, res) => {
    try {
        // Fetch completed orders
        const completedOrders = await Order.find({ isCompleted: true });

        // Initialize an array for the last 6 months
        const currentDate = dayjs();
        const paymentsSummary = Array.from({ length: 6 }, (_, i) => {
            const month = currentDate.subtract(i, 'month');
            return {
                name: month.format('MMMM'),
                Total: 0,
            };
        });

        // Accumulate payments into the corresponding month
        completedOrders.forEach(order => {
            const orderMonth = dayjs(order.createdAt).format('MMMM');
            const foundMonth = paymentsSummary.find(item => item.name === orderMonth);
            if (foundMonth) {
                foundMonth.Total += order.price;
            }
        });

        // Reverse the array to show from oldest to newest
        paymentsSummary.reverse();

        res.status(200).json(paymentsSummary);
    } catch (error) {
        console.error('Error fetching payments summary:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};



module.exports = {
  createOrder,getOrders,getUserOrders,getPaymentsSummary,getSingleOrderDetail
};
