const jwt = require('jsonwebtoken');
const Contact = require('../models/Contact'); // Adjust the path to your Contact model
const User = require('../models/User');
const { sendUserNotificationEmail } = require('../services/emailService');

const submitContactForm = async (req, res) => {
    try {
        const { email, message } = req.body;
        let userId = null;

        const token = req.cookies.accessToken;

        // Check if the token is present and verify it
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_KEY);
                userId = decoded.id;
            } catch (err) {
                // If token is invalid or expired, we keep userId as null
                console.log('Token is invalid or expired');
            }
        }

        // Validate the email and message
        if (!email || !message) {
            return res.status(400).json({ error: 'Email and message are required.' });
        }

        // Create a new contact entry
        const newContact = new Contact({
            userId,
            email,
            message
        });

        // Save the contact entry to the database
        await newContact.save();

        return res.status(201).json({ message: 'Contact form submitted successfully.' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).send({ error: 'An error occurred while submitting the contact form.' });
    }
};



const getAllMessages = async (req, res) => {
    try {
        
      const data=  await Contact.find();

        return res.status(201).send(data);
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).send({ error: 'An error occurred while submitting the contact form.' });
    }
};



const replyMessage = async (req, res) => {
    try {
      const { messageId,email ,message} = req.body;

      const response= await Contact.findByIdAndUpdate({_id:messageId},{
        $set:{isReplied:true}
      })
    
      if(!response) return res.status(400).send("Could not reply!");
      // Send warning email
      await sendUserNotificationEmail(email, 'emailReply',message);
  
      res.status(200).json({ message: "User has been replied" });
    } catch (error) {
      res.status(500).json({ message: "Server errorda", error });
    }
  };

module.exports={getAllMessages,submitContactForm,replyMessage}