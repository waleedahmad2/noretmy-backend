// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload, uploadImages } = require('../controllers/uploadController');

router.post('/upload', upload,uploadImages);

module.exports = router;
