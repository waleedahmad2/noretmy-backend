const { getSellerStatistics } = require('../services/sellerService'); // This imports the getSellerStatistics function

// Get seller statistics (ratings, earnings, active orders, etc.)
const getSellerStats = async (req, res) => {
  const { sellerId } = req.params; // Extract the sellerId from the request parameters

  try {
    // Fetch the seller's statistics by calling the service function
    const stats = await getSellerStatistics(sellerId);

    // Send the response with the statistics
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching seller statistics.'
    });
  }
};

module.exports = {
  getSellerStats
};
