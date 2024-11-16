const User = require("../models/User");
const { sendUserNotificationEmail } = require("../services/emailService");

const getAllUsers = async (req, res) => {
    try {
      const users = await User.find(); // Fetch all users from the database
  
      if (!users) {
        return res.status(404).json({ message: "No users found" });
      }
  
      res.status(200).json(users); // Respond with the user data
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (req.userId !== user._id.toString()) {
           return res.status(403).send("You can only delete your account!");
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).send("Deleted");
    } catch (error) {
        next(error);

    }
};


const getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        res.status(200).json({ totalUsers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const getVerifiedSellers = async (req, res) => {
  try {

    const verifiedSellers = await User.find(
      { isSeller: true, isVerifiedSeller: true },
      '_id fullName documentImages isCompany isBlocked isWarned' 
    );

    res.status(200).json(
      verifiedSellers
    );

  } catch (error) {
    console.error('Error fetching verified sellers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};


// Warn User Controller
const warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById({_id:userId});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // // Set the user as warned
    // user.isWarned = true;
    // await user.save();

    // Send warning email
    await sendUserNotificationEmail(user.email, 'warn');

    res.status(200).json({ message: "User has been warned" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Block User Controller
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById({_id:userId});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // // Set the user as blocked
    // user.isBlocked = true;
    // await user.save();

    // Send block email
    await sendUserNotificationEmail(user.email, 'block');

    res.status(200).json({ message: "User has been blocked" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


module.exports = { deleteUser ,getTotalUsers,getAllUsers, warnUser, blockUser,getVerifiedSellers};
