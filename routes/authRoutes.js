const express = require('express');
const { handleSignup, handleLogin, handleLogout, handleEmailVerification, handleResendVerificationEmail, handleVerifiedEmail } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', handleSignup);
router.post('/login', handleLogin);
router.post('/logout', handleLogout);
router.get('/verify-email', handleEmailVerification);
router.post('/verified-email', handleVerifiedEmail);
router.post('/resend-verification-email', handleResendVerificationEmail);

module.exports = router;
