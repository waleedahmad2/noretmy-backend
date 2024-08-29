const nodemailer = require('nodemailer');
require('dotenv').config();
const pdf = require('html-pdf');

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



const sendUserNotificationEmail = async (email, type, emailMessage) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject, message;

  if (type === 'warn') {
    subject = 'Warning Notice';
    message = `
      <p>Dear User,</p>
      <p>We have observed some activities on your account that violate our terms of service. Please be aware that continued violations may result in further action.</p>
      <p>We encourage you to review our guidelines to avoid any future issues.</p>
      <p>Best regards,<br>The Noretmy Team</p>
    `;
  } else if (type === 'block') {
    subject = 'Account Blocked';
    message = `
      <h2 style="text-align: center;">Your account has been disabled</h2>
      <p>Dear User,</p>
      <p>We regret to inform you that due to repeated violations of our terms of service, your account has been permanently blocked.</p>
      <p>If you believe this decision was made in error, please contact our support team for further assistance.</p>
      <p>Best regards,<br>The Noretmy Team</p>
    `;
  } else if (type === 'emailReply') {
    const ticketNumber = Math.floor(Math.random() * 1000000);
    subject = `Noretmy - Ticket #${ticketNumber}`;
    message = `
      <p>Dear User,</p>
      <p>${emailMessage}</p>
      <p>Best regards,<br>The Noretmy Team</p>
    `;
  }

  // HTML for the PDF
  const pdfHtml = `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center;">
          <img src="https://res.cloudinary.com/dhcylxn8c/image/upload/v1724607236/niqvh73lpbggjlnx1aeo.png" alt="Noretmy Logo" style="width: 150px; height: 120px;" />
        </div>
        ${message}
      </div>
    </body>
    </html>
  `;

  // Generate PDF from HTML
  const pdfBuffer = await new Promise((resolve, reject) => {
    pdf.create(pdfHtml).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });

  // Mail options with PDF attachment
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: pdfHtml, // HTML content
    attachments: [
      {
        filename: 'notification.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  // Send the email with attachment
  await transporter.sendMail(mailOptions);
};


module.exports = { sendVerificationEmail,sendUserNotificationEmail };
