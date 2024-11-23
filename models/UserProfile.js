const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  profilePicture: { type: String, required: false},
  location: { type: String, required: false},
  description: { type: String, required: false },
  skills: { type: [String], required: false }  // Array of skills
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
