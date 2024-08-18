const mongoose = require('mongoose');
const User = require('../models/User');

// Initialize database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};


// Save user to database
const saveUserToDatabase = async (user) => {
  const newUser = new User(user);
  await newUser.save();
  return newUser;
};

// Find user by email
const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Find user by verification token
const findUserByToken = async (token) => {
  return await User.findOne({ verificationToken: token });
};

// Update user's verification status
const verifyUser = async (email) => {
  return await User.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationToken: '' } });
};

module.exports = {
  connectDB,
  saveUserToDatabase,
  findUserByEmail,
  findUserByToken,
  verifyUser,
};
