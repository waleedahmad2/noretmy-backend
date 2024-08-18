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



const { uploadFiles, uploadImages } = require('./controllers/uploadController');
const upload = require('./config/multer-cloudinary-storage');
const cookieParser = require('cookie-parser');


require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

connectDB();

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
//   })
// );

app.use('/api',uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job',jobRoutes);
 app.use('/api/orders',orderRoutes);
// app.use('/api/conversations',conversationRoutes);
// app.use('/api/messages',messageRoutes);
// app.use('/api/reviews',reviewRoutes);

app.use((err,req,res,next)=>{
  const errorStatus=err.status || 500;
  const errorMessage= err.message || "Something went wrong!";

  return res.status(errorStatus).send(errorMessage);

})




const PORT = process.env.PORT || 5001;
app.listen(PORT,'0.0.0.0', () => console.log(`Server running on port ${PORT}`));
