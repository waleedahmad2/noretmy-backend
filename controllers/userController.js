const User = require("../models/User");
const { sendUserNotificationEmail } = require("../services/emailService");
const UserProfile = require('../models/UserProfile');
const Reviews = require('../models/Review');
const Job = require('../models/Job');


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





// Route to Create or Update User Profile

// Controller to create or update user profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const { userId, profilePicture, location, description, skills } = req.body;

    // Check if profile exists for this user
    let userProfile = await UserProfile.findOne({ userId });

    if (userProfile) {
      // If profile exists, update it
      userProfile.profilePicture = profilePicture;
      userProfile.location = location;
      userProfile.description = description;
      userProfile.skills = skills;
    } else {
      // If profile doesn't exist, create a new one
      userProfile = new UserProfile({
        userId,
        profilePicture,
        location,
        description,
        skills
      });
    }

    // Save the profile to the database
    await userProfile.save();

    res.status(200).json({ message: 'User profile updated successfully', data: userProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const updateSingleAttribute = async (req, res) => {
  try {
    const { userId } = req;
    const updates = req.body;  // This will contain the fields to be updated
    
    // Find the user profile by userId
    let userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      // If no profile is found, create a new one
      userProfile = new UserProfile({
        userId,
        ...updates // Apply the updates directly to the new profile
      });
    } else {
      // If the profile exists, update only the fields passed in the request body
      for (let key in updates) {
        if (updates[key] !== undefined) {
          userProfile[key] = updates[key];
        }
      }
    }

    // Save the new or updated profile
    await userProfile.save();

    res.status(200).json(userProfile );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




const getSellerData = async (req, res) => {
  try {
    const { userId } = req.userId; 

    // Initialize the response object
    let responseData = {
      fullName: null,
      username: null,
      createdAt: null,
      location: null,
      description: null,
      skills: [],
      reviews: [],
      averageRating: 0,
    };

    // Fetch user and profile data
    const user = await User.findById({_id:userId}).select('fullName username createdAt');
    if (user) {
      responseData.fullName = user.fullName;
      responseData.username = user.username;
      responseData.createdAt = user.createdAt;
    }

    const userProfile = await UserProfile.findOne({ userId }).select('location description skills');
    if (userProfile) {
      responseData.location = userProfile.location;
      responseData.description = userProfile.description;
      responseData.skills = userProfile.skills;
    }

    // Fetch gigs posted by the seller
    const sellerGigs = await Job.find({ sellerId: userId }).select('_id');
    const gigIds = sellerGigs.map((gig) => gig._id);

    if (gigIds.length > 0) {
      // Fetch reviews for the seller's gigs
      const reviews = await Reviews.find({ gigId: { $in: gigIds } });
      responseData.reviews = reviews.map((review) => ({
        gigId: review.gigId,
        star: review.star,
        desc: review.desc,
        createdAt: review.createdAt,
      }));

      // Calculate the average rating
      if (reviews.length > 0) {
        responseData.averageRating =
          reviews.reduce((acc, review) => acc + review.star, 0) / reviews.length;
      }
    }

    // Check if no data was found in any of the models
    const noData =
      !responseData.fullName &&
      !responseData.username &&
      !responseData.location &&
      !responseData.description &&
      responseData.skills.length === 0 &&
      responseData.reviews.length === 0;

    if (noData) {
      return res.status(404).json({ message: 'No data found for the given seller.' });
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { deleteUser ,getTotalUsers,getAllUsers, warnUser, blockUser,getVerifiedSellers,updateSingleAttribute,createOrUpdateProfile,getSellerData};
