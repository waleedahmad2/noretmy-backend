const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { Readable } = require('stream');

const storage = multer.memoryStorage(); // Use memory storage instead of disk storage
const upload = multer({ storage }).array('images', 5);

const uploadImages = async (req, res) => {
  console.log('Request Body:', req.body);
  console.log('Request Files:', req.files);

  try {
    if (!req.files || !Array.isArray(req.files)) {
      console.log('No files received');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Function to upload a file to Cloudinary
    const uploadToCloudinary = async (file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });

        Readable.from(file.buffer).pipe(stream);
      });
    };

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(uploadToCloudinary);
    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs from the Cloudinary responses
    const urls = uploadResults.map(result => result.secure_url);

    res.json({
      success: true,
      urls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

router.post('/upload', upload, uploadImages);

module.exports = router;
