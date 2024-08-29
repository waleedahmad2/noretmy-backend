const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinaryConfig');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage }).array("images",5);

const uploadImages = async (req, res) => {
    // Log the request body to see if anything else is being sent
    console.log('Request Body:', req.body);
  
    // Log the files array to see if multer is processing the files correctly
    console.log('Request Files:', req.files);
  
    try {
      // Check if files were uploaded
      if (!req.files || !Array.isArray(req.files)) {
        console.log('No files received');
        return res.status(400).json({ error: 'No files uploaded' });
      }
  
      // Log each file's details
      req.files.forEach(file => {
        console.log(`Received file - originalname: ${file.originalname}, path: ${file.path}, mimetype: ${file.mimetype}`);
      });
  
      // Extract file paths and upload to Cloudinary
      const filePaths = req.files.map(file => file.path);
  
      const uploadPromises = req.files.map(file =>
        cloudinary.uploader.upload(file.path)
      );
  
      const uploadResults = await Promise.all(uploadPromises);
  
      // Clean up uploaded files from the local file system
      filePaths.forEach(filePath => fs.unlinkSync(filePath));
  
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
  
  module.exports = {
    upload,
    uploadImages
  };
  
