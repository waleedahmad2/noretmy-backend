const User = require("../models/User");
const {createError}=require("../utils/createError")

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
            return next(createError(403,"You can only delete your account!"));
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).send("Deleted");
    } catch (error) {
        next(createError(500,"Error deleting user!"));
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

module.exports = { deleteUser ,getTotalUsers,getAllUsers};
