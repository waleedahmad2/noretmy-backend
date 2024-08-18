// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const { createJob ,getAllJobs, getUserJobs,getFeaturedJobs} = require('../controllers/jobController');

const upload = multer({ storage });

const router = express.Router();

router.post("/",getUserJobs);
router.post('/add-job', upload.any(), createJob);
router.get('/', getAllJobs);
router.get('/feature', getFeaturedJobs);



module.exports = router;
