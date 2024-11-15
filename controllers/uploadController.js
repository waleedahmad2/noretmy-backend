const cloudinary = require('../config/cloudinaryConfig');
const { Readable } = require('stream');
const multer = require('multer');
const User = require('../models/User');

// Use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('images', 5); // Declare upload only once here

// Function to handle image uploads
const uploadImages = async (req, res) => {
  console.log('Request Body:', req.body);
  console.log('Request Files:', req.files);

  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('No files received');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Function to upload a file to Cloudinary
    const uploadToCloudinary = async (file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        });

        if (file.buffer) {
          Readable.from(file.buffer).pipe(stream);
        } else {
          reject(new Error('File buffer is missing.'));
        }
      });
    };

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(uploadToCloudinary);
    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs from Cloudinary responses
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


const uploadandVerifyImages= async (req,res)=>{



  try {

    const documentUrls = await uploadImages(req,res);

    const userId= req.userId;
  
    const user= await User.findById(userId);
  
    if(!user){
        return res.status(404).json({error : "User not found!"});
    }
  
    user.documentImages = [...user.documentImages, ...documentUrls];
    user.isVerifiedSeller = true
  
    await user.save();
  
    res.json({
      success: true,
      urls: documentUrls,
      message: 'Documents uploaded and user verified successfully'
    });
  
    
  } catch (error) {
    res.status(500).json({error: error.message || "Internal Server Error"})
  }


}

module.exports = {
  upload,
  uploadImages,
  uploadandVerifyImages
};
