const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { Readable } = require('stream');

// Import the middleware functions
const { upload, uploadImages } = require('../controllers/uploadController');

const storage = multer.memoryStorage(); // Use memory storage instead of disk storage
const upload = multer({ storage }).array('images', 5);

router.post('/upload', upload, uploadImages);

module.exports = router;
