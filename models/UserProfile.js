const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  profilePicture: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  skills: { type: [String], required: true }  // Array of skills
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
