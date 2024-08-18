const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail } = require('./emailService');

const signUp = async (email, password, fullName, username) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const token = crypto.randomBytes(32).toString('hex');

  const user = new User({
    email,
    password,
    fullName,
    username,
    isVerified: false,
    verificationToken: token,
  });

  await user.save();
  await sendVerificationEmail(email, token);

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
  };
};

const verifyEmail = async (email, token) => {
  const user = await User.findOne({ email, verificationToken: token });
  if (!user) {
    throw new Error('Invalid token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
};

const signIn = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  if (!user.isVerified) {
    throw new Error('Email not verified');
  }
  if (user && (await user.matchPassword(password))) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      isSeller:user.isSeller,
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  if (user.isVerified) {
    throw new Error('Email already verified');
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.verificationToken = token;
  await user.save();

  await sendVerificationEmail(email, token);
};

module.exports = { signUp, signIn, getUserByEmail, verifyEmail, resendVerificationEmail };
