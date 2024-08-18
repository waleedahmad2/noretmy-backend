const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Use environment variable
      pass: process.env.EMAIL_PASS, // Use environment variable
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER, // Use environment variable
    to: email,
    subject: 'Email Verification',
    html: `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h1 style="color: #007bff; text-align: center;">Noretmy</h1>
          <h2 style="color: #007bff; text-align: center;">Welcome to Noretmy!</h2>
          <p>Hello,</p>
          <p>Thank you for registering with Noretmy. To complete your registration, please verify your email address by clicking the button below:</p>
          <a href="${process.env.BASE_URL}/api/auth/verify-email?token=${token}&email=${email}" 
             style="display: inline-block; padding: 15px 25px; margin-top: 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
             Verify Your Email
          </a>
          <p>If you did not register for this account, please ignore this email.</p>
          <p>Best regards,<br>The Noretmy Team</p>
        </div>
      </body>
      </html>
    `,
  };
  

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
