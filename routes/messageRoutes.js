// const express = require('express');
// const { verifyToken } = require('../middleware/jwt');
// const { createMessage, getMessages,searchSensitiveMessages,setSocketIO } = require('../controllers/messageController');

// const router = express.Router();

// // Create a Socket.IO instance
// const socketIO = require('socket.io');
// const io = socketIO(); // Initialize with your HTTP server instance

// setSocketIO(io);

// // Pass the Socket.IO instance to the message controller
// // const messageController = require('../controllers/messageController')(io);

// router.post('/', verifyToken, createMessage);
// router.get('/:id', verifyToken, getMessages);
// router.get('/sensitive-messages', searchSensitiveMessages);


// module.exports = router;




const express = require('express');
const { verifyToken } = require('../middleware/jwt');
const { createMessage, getMessages, searchSensitiveMessages, setSocketIO } = require('../controllers/messageController');

const router = express.Router();

// Create a Socket.IO instance
const socketIO = require('socket.io');
const io = socketIO(); // Initialize with your HTTP server instance

setSocketIO(io); // Set Socket.IO instance for the controller

// Define routes

router.get('/sensitive-messages', searchSensitiveMessages); // Ensure this route is correctly defined

router.post('/', verifyToken, createMessage);
router.get('/:id', verifyToken, getMessages);

module.exports = router;

