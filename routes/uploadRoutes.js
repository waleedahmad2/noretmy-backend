const express = require('express');
const router = express.Router();
const { upload, uploadImages } = require('../controllers/uploadController'); // Import both the upload middleware and the handler

// Use the imported upload middleware directly
router.post('/upload', upload, uploadImages);

module.exports = router;
