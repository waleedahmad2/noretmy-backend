const Order = require('../models/Order');
const mongoose = require('mongoose');

// Helper function to calculate the first day of the current month
const getFirstDayOfCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getSellerStatistics = async (sellerId) => {
  // Get the current month date range (from the first of the month to now)
  const firstDayOfMonth = getFirstDayOfCurrentMonth();
  const currentDate = new Date();

  // Querying for the seller's statistics
  try {
    // Count the number of total orders for the seller
    const totalOrders = await Order.countDocuments({ sellerId });

    // Count active orders (orders where isCompleted is false)
    const activeOrders = await Order.countDocuments({ sellerId, isCompleted: false });

    // Count cancelled orders (orders where isCancelled is true)
    const cancelledOrders = await Order.countDocuments({ sellerId, isCancelled: true });

    // Total earnings (isCompleted true, isPaid true)
    const earnings = await Order.aggregate([
      { $match: { sellerId, isCompleted: true, isPaid: true } },
      { $group: { _id: null, totalEarnings: { $sum: '$price' } } }
    ]);

    const totalEarnings = earnings.length > 0 ? earnings[0].totalEarnings : 0;

    // Earnings available for withdrawal (isCompleted true, isPaid false)
    const availableForWithdrawal = await Order.aggregate([
      { $match: { sellerId, isCompleted: true, isPaid: false } },
      { $group: { _id: null, totalAvailable: { $sum: '$price' } } }
    ]);

    const availableForWithdrawalAmount = availableForWithdrawal.length > 0 ? availableForWithdrawal[0].totalAvailable : 0;

    // Current month earnings (isCompleted true, isPaid true, within the current month)
    const currentMonthEarnings = await Order.aggregate([
      {
        $match: {
          sellerId,
          isCompleted: true,
          isPaid: true,
          createdAt: { $gte: firstDayOfMonth } // Orders created in the current month
        }
      },
      { $group: { _id: null, totalCurrentMonthEarnings: { $sum: '$price' } } }
    ]);

    const currentMonthTotalEarnings = currentMonthEarnings.length > 0 ? currentMonthEarnings[0].totalCurrentMonthEarnings : 0;

    // Average selling price of completed orders
    const averageSellingPrice = await Order.aggregate([
      { $match: { sellerId, isCompleted: true } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);

    const avgSellingPrice = averageSellingPrice.length > 0 ? averageSellingPrice[0].avgPrice : 0;

    // Rating (If you have a ratings or reviews collection, you can calculate this here)
    // Assuming you have a `Review` model that stores reviews with a `sellerId` and `rating`
    const reviews = await Review.aggregate([
      { $match: { sellerId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    const rating = reviews.length > 0 ? reviews[0].averageRating : 0;

    return {
      totalOrders,
      activeOrders,
      earnings: totalEarnings,
      availableForWithdrawal: availableForWithdrawalAmount,
      currentMonthEarnings: currentMonthTotalEarnings,
      avgSellingPrice,
      cancelledOrders,
      rating
    };
  } catch (error) {
    console.error('Error fetching seller statistics:', error);
    throw error;
  }
};

module.exports = { getSellerStatistics };
