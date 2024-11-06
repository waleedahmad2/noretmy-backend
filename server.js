const express = require('express');
const session = require('express-session');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./services/dbService');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


const { uploadFiles, uploadImages } = require('./controllers/uploadController');
const upload = require('./config/multer-cloudinary-storage');
const cookieParser = require('cookie-parser');
const socketHandler = require('./sockets/socketHandler'); // Import socket handler

require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    console.log('Origin: ', origin);
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS: ', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));




app.use(express.json());
app.use(cookieParser());

connectDB();



app.get('/', (req, res) => { 
  try { 
    res.send('Hello, World!'); 
  } catch (error) { 
    console.error('Error in / route:', error); 
    res.status(500).send('Internal Server Error'); 
  } 
});

// Session middleware (if you need session-based authentication)
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
//   })
// );

// Route handlers
app.use('/api', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).send(errorMessage);
});

// Create HTTP server and integrate with Socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: ['http://localhost:8081', 'http://localhost:3001'], // List allowed origins here
    credentials: true,
  }
});

// Initialize socket handler with the io instance
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
