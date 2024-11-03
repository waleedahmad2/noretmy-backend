const { sign } = require('jsonwebtoken');
const { signUp, signIn, verifyEmail, resendVerificationEmail } = require('../services/authService');
const User = require('../models/User');

const handleSignup = async (req, res,next) => {
  const { email, password, fullName, username,isSeller,isCompany} = req.body;
  try {
    const user = await signUp(email, password, fullName, username,isSeller,isCompany);


    res.status(201).json({ message: 'Verification email sent. Please check your email to verify your account.' });
  } catch (error) {
   next(error);
  }
};

const handleLogin = async (req, res,next) => {
  const { email, password } = req.body;
  try {
    const user = await signIn(email, password);
    

    const token= sign({
      id:user.id,
      isSeller:user.isSeller,
    },process.env.JWT_KEY)

    // req.session.user = user;
    // const {password,...info}=user;
    res.cookie("accessToken",token,{
      httpOnly:true,
      secure: true, 
  sameSite: 'None',
    }).status(200)
    .json(user);
  } catch (error) {
res.status(500).send(error);
    console.log(error);
  }
};

const handleVerifiedEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }); // Access email from req.body
    if (user && user.isVerified === true) {
      res.status(200).send("User is verified!");
    } else if (user && user.isVerified === false) {
      res.status(400).send("User is not verified");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
};



const handleLogout = async (req, res) => {
  res.clearCookie("accessToken",{
    sameSite:"none",
    secure:true,

  }).status(200).send("User has been logged out!")
};

const handleEmailVerification = async (req, res,next) => {
  const { email, token } = req.query;
  try {
    await verifyEmail(email, token);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error)
  }
};

const handleResendVerificationEmail = async (req, res,next) => {
  const { email } = req.body;
  try {
    await resendVerificationEmail(email);
    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    next(error)

  }
};

module.exports = { handleSignup, handleLogin, handleLogout, handleEmailVerification,handleVerifiedEmail, handleResendVerificationEmail };
